const cron = require('node-cron');
const pool = require('../db/pool');
const { sendLicenseExpiryEmail } = require('../utils/mailer');

// Runs every day at 8am
cron.schedule('0 8 * * *', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`[Cron Job] Checking expiring licenses on ${today}...`);

    const query = `
      SELECT name, email, license_expiry 
      FROM drivers
      WHERE license_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND email IS NOT NULL AND email != ''
    `;
    const [drivers] = await pool.query(query);

    for (const d of drivers) {
      let expiryStr = '';
      if (d.license_expiry) {
        const expDate = new Date(d.license_expiry);
        const yyyy = expDate.getFullYear();
        const mm = String(expDate.getMonth() + 1).padStart(2, '0');
        const dd = String(expDate.getDate()).padStart(2, '0');
        expiryStr = `${yyyy}-${mm}-${dd}`;
      }
      
      console.log(`[Cron Job] Sending expiration reminder email to: ${d.email} for driver: ${d.name}`);
      await sendLicenseExpiryEmail(d.email, d.name, expiryStr);
    }
  } catch (err) {
    console.error('[Cron Job Error] Failed to execute license checks:', err);
  }
});

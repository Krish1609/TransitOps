const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { sendLicenseExpiryEmail } = require('../utils/mailer');

// POST /api/admin/check-licenses - Manual Safety Officer trigger
router.post('/check-licenses', requireAuth, requireRole('Safety Officer', 'Fleet Manager'), async (req, res) => {
  try {
    const query = `
      SELECT name, email, license_expiry 
      FROM drivers
      WHERE license_expiry BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
        AND email IS NOT NULL AND email != ''
    `;
    const [drivers] = await pool.query(query);
    let sentCount = 0;

    for (const d of drivers) {
      let expiryStr = '';
      if (d.license_expiry) {
        const expDate = new Date(d.license_expiry);
        const yyyy = expDate.getFullYear();
        const mm = String(expDate.getMonth() + 1).padStart(2, '0');
        const dd = String(expDate.getDate()).padStart(2, '0');
        expiryStr = `${yyyy}-${mm}-${dd}`;
      }

      await sendLicenseExpiryEmail(d.email, d.name, expiryStr);
      sentCount++;
    }

    res.json({ 
      status: 'reminders sent', 
      checked_at: new Date().toISOString(),
      expiring_drivers_count: drivers.length,
      emails_dispatched: sentCount
    });

  } catch (err) {
    console.error('[Admin API Error] Failed to manually check licenses:', err);
    res.status(500).json({ error: 'Failed to process license checks' });
  }
});

module.exports = router;

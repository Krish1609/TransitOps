const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'demo_carrier@ethereal.email',
    pass: process.env.SMTP_PASS || 'demo_pass_123',
  },
});

async function sendLicenseExpiryEmail(to, driverName, expiryDate) {
  // If destination email is missing, log a warning and skip
  if (!to) {
    console.warn(`[Mailer] Cannot send reminder for driver: "${driverName}" — Missing destination address.`);
    return;
  }

  await transporter.sendMail({
    from: `"TransitOps" <${process.env.SMTP_USER || 'notifications@transitops.com'}>`,
    to,
    subject: `License Expiry Reminder — ${driverName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 550px; background-color: #0f172a; color: #f1f5f9; padding: 24px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #6366f1; margin-top: 0;">TransitOps Safety Seat Alert</h2>
        <p>Driver <b>${driverName}</b>'s operator license is expiring soon:</p>
        <div style="background-color: #1e293b; padding: 16px; border-radius: 8px; border-left: 4px solid #ef4444; font-family: monospace; font-size: 14px; margin: 16px 0;">
          <b>License Expiry Date:</b> ${expiryDate}
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0;">
          Please update licensing details in the driver profile dashboard to remain eligible for trip dispatches.
        </p>
      </div>
    `,
  });
}

async function sendResetPasswordEmail(to, name, resetCode) {
  if (!to) return;
  await transporter.sendMail({
    from: `"TransitOps Control" <${process.env.SMTP_USER || 'notifications@transitops.com'}>`,
    to,
    subject: `TransitOps Verification Pin: ${resetCode}`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; background-color: #0f172a; color: #f1f5f9; padding: 24px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #6366f1; margin-top: 0;">TransitOps Access Control</h2>
        <p>Hello ${name},</p>
        <p>You requested a password reset verification code for your TransitOps console account. Please use the following code:</p>
        <div style="background-color: #1e293b; padding: 16px; text-align: center; border-radius: 8px; border: 1px dashed #6366f1; font-family: monospace; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #818cf8; margin: 16px 0;">
          ${resetCode}
        </div>
        <p style="color: #94a3b8; font-size: 11px; margin-bottom: 0;">
          This code is highly sensitive and will expire in 15 minutes. If you did not trigger this reset request, safety protocols suggest checking your account credentials.
        </p>
      </div>
    `,
  });
}

module.exports = { sendLicenseExpiryEmail, sendResetPasswordEmail };

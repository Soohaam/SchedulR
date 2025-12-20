require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Generic email sender with:
 * - SMTP support
 * - TLS handling
 * - Safe fallback to mock email
 */
const sendEmail = async ({ to, subject, text, html }) => {
  // Check if SMTP credentials exist
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true', // true for 465
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          // Reject unauthorized certs only in production unless explicitly disabled
          rejectUnauthorized:
            process.env.NODE_ENV === 'production' &&
            process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Odoo Final" <noreply@odoofinal.com>',
        to,
        subject,
        text,
        html,
      });

      return; // ✅ Email sent successfully
    } catch (error) {
      console.error('[EMAIL ERROR]', error.message);
      console.log('⚠️ Falling back to mock email...');
    }
  }

  // 🧪 Mock email (dev or SMTP failure)
  console.log('---------------------------------------------------');
  console.log(`📧 [MOCK EMAIL] To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${text}`);
  console.log('---------------------------------------------------');
};

/**
 * Password reset email
 */
const sendPasswordResetEmail = async (email, fullName, resetToken) => {
  const resetUrl = `${
    process.env.FRONTEND_URL || 'http://localhost:3000'
  }/reset-password?token=${resetToken}`;

  const subject = 'Password Reset Request - Odoo Appointment Booking';

  const text = `Hi ${fullName},

You recently requested to reset your password for your Odoo Appointment Booking account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request a password reset, please ignore this email.

Best regards,
Odoo Appointment Booking Team`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2>Password Reset Request</h2>
      <p>Hi <strong>${fullName}</strong>,</p>
      <p>You requested to reset your password.</p>

      <a href="${resetUrl}"
         style="display:inline-block;margin:20px 0;padding:12px 24px;
                background:#4CAF50;color:#fff;text-decoration:none;border-radius:4px;">
        Reset Password
      </a>

      <p>If the button doesn’t work, copy this link:</p>
      <p style="word-break: break-all;">${resetUrl}</p>

      <p><strong>This link expires in 1 hour.</strong></p>

      <hr />
      <p style="font-size:12px;color:#999;">
        If you didn’t request this, you can safely ignore this email.
      </p>
      <p style="font-size:12px;color:#999;">
        — Odoo Appointment Booking Team
      </p>
    </div>
  `;

  await sendEmail({ to: email, subject, text, html });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};

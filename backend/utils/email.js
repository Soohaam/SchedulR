require('dotenv').config();
const nodemailer = require('nodemailer');


const sendEmail = async ({ to, subject, text, html }) => {
  // If SMTP credentials are provided, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Odoo Final" <noreply@odoofinal.com>',
      to,
      subject,
      text,
      html,
    });
  } else {
    // Fallback for development: Log to console
    console.log('---------------------------------------------------');
    console.log(`📧 [MOCK EMAIL] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('---------------------------------------------------');
  }
};

module.exports = { sendEmail };

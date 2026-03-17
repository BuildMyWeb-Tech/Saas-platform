// services/emailService.js
// ─────────────────────────────────────────────
//  Nodemailer SMTP Email Service
//  Handles transactional emails for auth flows
// ─────────────────────────────────────────────

const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
};

// ─── Shared HTML email wrapper ───────────────────────────────────────────────
const emailWrapper = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PrintMixBox</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0f0f0f; font-family: 'Helvetica Neue', Arial, sans-serif; color: #e0e0e0; }
    .container { max-width: 560px; margin: 40px auto; background: #1a1a1a; border-radius: 12px; overflow: hidden; border: 1px solid #2a2a2a; }
    .header { background: linear-gradient(135deg, #00d4a1 0%, #0099cc 100%); padding: 32px 40px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #fff; letter-spacing: -0.5px; }
    .header p { font-size: 13px; color: rgba(255,255,255,0.8); margin-top: 4px; }
    .body { padding: 40px; }
    .body p { font-size: 15px; line-height: 1.7; color: #b0b0b0; margin-bottom: 16px; }
    .code-box { background: #0f0f0f; border: 1px solid #00d4a1; border-radius: 8px; padding: 20px 32px; margin: 24px 0; text-align: center; }
    .code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #00d4a1; font-family: 'Courier New', monospace; }
    .company-code { font-size: 18px; font-weight: 600; color: #fff; background: #2a2a2a; padding: 8px 16px; border-radius: 6px; display: inline-block; letter-spacing: 2px; margin-top: 8px; }
    .note { font-size: 13px; color: #666; margin-top: 8px; }
    .footer { border-top: 1px solid #2a2a2a; padding: 20px 40px; text-align: center; font-size: 12px; color: #444; }
    .footer a { color: #00d4a1; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🖨️ PrintMixBox</h1>
      <p>IoT Printing & Box Branding Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} PrintMixBox. All rights reserved.</p>
      <p style="margin-top:6px;">This is an automated message. <a href="#">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>
`;

// ─── Send Verification Email ──────────────────────────────────────────────────
const sendVerificationEmail = async ({ to, companyName, companyCode, verificationCode }) => {
  const transporter = createTransporter();

  const htmlContent = emailWrapper(`
    <p>Welcome to <strong style="color:#fff;">PrintMixBox</strong>, <strong style="color:#fff;">${companyName}</strong>!</p>
    <p>Your company has been registered. To activate your account, please verify your email using the OTP below.</p>

    <div class="code-box">
      <div class="code">${verificationCode}</div>
      <div class="note">Valid for 30 minutes</div>
    </div>

    <p>Your unique <strong style="color:#fff;">Company Code</strong> is:</p>
    <div style="text-align:center; margin: 16px 0;">
      <span class="company-code">${companyCode}</span>
    </div>
    <p>You'll need this code every time you log in. Keep it safe!</p>
    <p>If you didn't register, please ignore this email.</p>
  `);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `[PrintMixBox] Verify your company account — ${companyCode}`,
    html: htmlContent,
    text: `Welcome to PrintMixBox!\n\nYour verification code: ${verificationCode}\nYour company code: ${companyCode}\n\nThe code expires in 30 minutes.`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧  Verification email sent to ${to} [MessageID: ${info.messageId}]`);
  return info;
};

// ─── Send Welcome Email (post-verification) ───────────────────────────────────
const sendWelcomeEmail = async ({ to, companyName, companyCode }) => {
  const transporter = createTransporter();

  const htmlContent = emailWrapper(`
    <p>Great news! Your company <strong style="color:#fff;">${companyName}</strong> has been successfully verified.</p>
    <p>You can now log in to the PrintMixBox platform using:</p>
    <div class="code-box">
      <div style="font-size:13px; color:#888; margin-bottom:8px;">YOUR COMPANY CODE</div>
      <span class="company-code">${companyCode}</span>
    </div>
    <p>Start managing your printers, branding templates, and print jobs from your dashboard.</p>
    <p style="margin-top:24px;">
      <a href="${process.env.FRONTEND_URL}/login" style="background:linear-gradient(135deg,#00d4a1,#0099cc); color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
        Go to Dashboard →
      </a>
    </p>
  `);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `[PrintMixBox] Account verified — Welcome aboard, ${companyName}!`,
    html: htmlContent,
    text: `Your PrintMixBox account is verified!\nCompany Code: ${companyCode}\nLogin at: ${process.env.FRONTEND_URL}/login`,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧  Welcome email sent to ${to}`);
  return info;
};

// ─── Verify SMTP connection ───────────────────────────────────────────────────
const verifyEmailConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅  Email service connected (SMTP ready)');
  } catch (error) {
    console.warn(`⚠️   Email service connection failed: ${error.message}`);
  }
};

module.exports = {
  sendVerificationEmail,
  sendWelcomeEmail,
  verifyEmailConnection,
};

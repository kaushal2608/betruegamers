import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

let transporter = null;

if (ENV.EMAIL.USER && ENV.EMAIL.PASS) {
  transporter = nodemailer.createTransport({
    host: ENV.EMAIL.HOST,
    port: ENV.EMAIL.PORT,
    secure: ENV.EMAIL.PORT === 465,
    auth: {
      user: ENV.EMAIL.USER,
      pass: ENV.EMAIL.PASS
    }
  });
}

export const sendOtpEmail = async (toEmail, otpCode, purpose = 'SIGNUP') => {
  const isReset = purpose === 'PASSWORD_RESET' || purpose.toLowerCase().includes('reset');
  const subject = isReset
    ? 'Your BeTrueGamers Password Reset Code'
    : 'Your BeTrueGamers Verification Code';

  const headingText = isReset ? 'RESET YOUR PASSWORD' : 'VERIFY YOUR ACCOUNT';
  const descriptionText = isReset
    ? 'We received a request to reset the password for your BeTrueGamers account. Use the 6-digit code below to proceed:'
    : 'Welcome to BeTrueGamers! Use the 6-digit verification code below to activate your account:';
  const footerNotice = isReset
    ? 'This code is valid for 10 minutes. If you did not request a password reset, you can safely ignore this email; your account remains secure.'
    : 'This code is valid for 10 minutes. If you did not create an account with BeTrueGamers, please ignore this email.';

  const html = `
    <div style="background-color: #080a0f; color: #f3f4f6; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 30px; border-radius: 12px; max-width: 520px; margin: 0 auto; border: 1px solid #1f293d; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 25px;">
        <h1 style="color: #00f0ff; letter-spacing: 3px; margin: 0; font-size: 26px; text-transform: uppercase; font-weight: 800;">BETRUEGAMERS</h1>
        <div style="height: 2px; width: 60px; background: linear-gradient(90deg, #00f0ff, #7000ff); margin: 10px auto 0;"></div>
      </div>
      
      <div style="background-color: #0f1422; border-radius: 8px; padding: 24px; border: 1px solid #1e293b;">
        <h2 style="color: #ffffff; font-size: 18px; margin-top: 0; letter-spacing: 1px;">${headingText}</h2>
        <p style="font-size: 15px; color: #94a3b8; line-height: 1.6; margin: 12px 0 20px;">${descriptionText}</p>
        
        <div style="background-color: #080a0f; padding: 18px; border-radius: 8px; text-align: center; margin: 20px 0; border: 2px dashed ${isReset ? '#f59e0b' : '#00f0ff'};">
          <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: ${isReset ? '#f59e0b' : '#00f0ff'}; font-family: monospace;">${otpCode}</span>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 15px 0 0;">
          ⏱️ ${footerNotice}
        </p>
      </div>

      <div style="text-align: center; margin-top: 25px;">
        <p style="font-size: 12px; color: #475569; margin: 0;">
          © ${new Date().getFullYear()} BeTrueGamers Arena. All rights reserved.
        </p>
      </div>
    </div>
  `;

  if (transporter) {
    try {
      await transporter.sendMail({
        from: ENV.EMAIL.FROM,
        to: toEmail,
        subject,
        html
      });
      console.log(`[Mailer] OTP (${purpose}) sent via email to ${toEmail}`);
      return true;
    } catch (err) {
      console.warn(`[Mailer Warning] Failed to send email via SMTP: ${err.message}. Logging OTP to console.`);
    }
  }

  // Developer fallback
  console.log(`\n==============================================`);
  console.log(`🔑 [DEV EMAIL OTP (${purpose})] To: ${toEmail} | CODE: ${otpCode}`);
  console.log(`==============================================\n`);
  return true;
};

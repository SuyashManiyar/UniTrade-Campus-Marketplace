import nodemailer from 'nodemailer';

// Create transporter only if real emails are enabled
const createTransporter = () => {
  if (process.env.SEND_REAL_EMAILS === 'true') {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return null;
};

export const sendVerificationEmail = async (email: string, code: string) => {
  // If real emails are disabled, just log to console
  if (process.env.SEND_REAL_EMAILS !== 'true') {
    console.log(`📧 Verification email for ${email}: ${code}`);
    console.log(`🔗 Email would contain: "Your verification code is ${code}"`);
    return true;
  }

  // Send real email
  const transporter = createTransporter();
  if (!transporter) {
    console.error('Email transporter not configured');
    return false;
  }

  const mailOptions = {
    from: `"UMass Marketplace" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'UMass Marketplace - Email Verification',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #881c1c; margin: 0;">UMass Marketplace</h1>
          <p style="color: #666; margin: 5px 0;">Secure Campus Trading</p>
        </div>
        
        <h2 style="color: #333;">Email Verification Required</h2>
        <p style="color: #555; line-height: 1.6;">
          Welcome to UMass Marketplace! To complete your registration and start trading safely 
          within the UMass community, please verify your email address.
        </p>
        
        <div style="background: linear-gradient(135deg, #881c1c, #a52a2a); padding: 25px; text-align: center; border-radius: 10px; margin: 25px 0;">
          <p style="color: white; margin: 0 0 10px 0; font-size: 16px;">Your Verification Code:</p>
          <div style="background-color: white; color: #881c1c; padding: 15px; font-size: 32px; font-weight: bold; letter-spacing: 3px; border-radius: 5px; font-family: 'Courier New', monospace;">
            ${code}
          </div>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="color: #881c1c; margin-top: 0;">Important:</h3>
          <ul style="color: #555; line-height: 1.6;">
            <li>This code expires in <strong>10 minutes</strong></li>
            <li>Only use this code on the official UMass Marketplace website</li>
            <li>Never share this code with anyone</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; line-height: 1.6;">
          If you didn't create an account with UMass Marketplace, please ignore this email. 
          Your email address will not be used without verification.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
          UMass Marketplace - Connecting the UMass Amherst Community<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return false;
  }
};

export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
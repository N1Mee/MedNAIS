import nodemailer from 'nodemailer';

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@mednais.com';
const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Dev mode: if no SMTP credentials, just log the link
const DEV_MODE = !SMTP_USER || !SMTP_PASSWORD;

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
});

/**
 * Send magic link email
 */
export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const magicLink = `${APP_URL}/auth/magic?token=${token}`;
  
  // DEV MODE: Just log the link instead of sending email
  if (DEV_MODE) {
    console.log('\n' + '='.repeat(80));
    console.log('🔐 MAGIC LINK (DEV MODE)');
    console.log('='.repeat(80));
    console.log(`📧 To: ${email}`);
    console.log(`🔗 Link: ${magicLink}`);
    console.log(`⏰ Expires in: 15 minutes`);
    console.log('='.repeat(80) + '\n');
    return;
  }
  
  const mailOptions = {
    from: FROM_EMAIL,
    to: email,
    subject: 'Sign in to MedNAIS™',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; border-radius: 10px; padding: 30px; text-align: center;">
          <h1 style="color: #E63946; margin-bottom: 20px;">MedNAIS™</h1>
          <h2 style="color: #333; margin-bottom: 30px;">Sign in to your account</h2>
          
          <p style="font-size: 16px; margin-bottom: 30px;">
            Click the button below to securely sign in to your MedNAIS™ account.
          </p>
          
          <a href="${magicLink}" 
             style="display: inline-block; background-color: #E63946; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">
            Sign In
          </a>
          
          <p style="font-size: 14px; color: #666; margin-top: 30px;">
            This link will expire in 15 minutes for security reasons.
          </p>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">
            If you didn't request this email, you can safely ignore it.
          </p>
          
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999;">
            © 2025 MedNAIS™. All rights reserved.
          </p>
        </div>
      </body>
      </html>
    `,
    text: `
      Sign in to MedNAIS™
      
      Click the link below to sign in:
      ${magicLink}
      
      This link will expire in 15 minutes.
      
      If you didn't request this email, you can safely ignore it.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Magic link email sent to ${email}`);
  } catch (error) {
    console.error('Error sending magic link email:', error);
    throw new Error('Failed to send magic link email');
  }
}

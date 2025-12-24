import nodemailer from "nodemailer";

interface SendVerificationEmailParams {
  email: string;
  name: string;
  verificationToken: string;
}

export async function sendVerificationEmail({
  email,
  name,
  verificationToken,
}: SendVerificationEmailParams) {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_SERVER_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // Verification URL
    const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${verificationToken}`;

    // Email content in Russian
    const mailOptions = {
      from: `"MedNAIS" <${process.env.EMAIL_SERVER_USER}>`,
      to: email,
      subject: "Подтвердите ваш email - MedNAIS",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .container {
                background: #ffffff;
                border-radius: 8px;
                padding: 40px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .logo {
                font-size: 32px;
                font-weight: bold;
                color: #E63946;
                margin-bottom: 10px;
              }
              h1 {
                color: #E63946;
                font-size: 24px;
                margin-bottom: 20px;
              }
              .button {
                display: inline-block;
                background: #E63946;
                color: #ffffff !important;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: 600;
                margin: 20px 0;
              }
              .footer {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #666;
                text-align: center;
              }
              .info-box {
                background: #f8f9fa;
                border-left: 4px solid #E63946;
                padding: 15px;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">MedNAIS™</div>
              </div>
              
              <h1>Добро пожаловать, ${name || "Пользователь"}!</h1>
              
              <p>Спасибо за регистрацию в MedNAIS - маркетплейсе стандартных операционных процедур (SOP).</p>
              
              <p>Для завершения регистрации и активации вашего аккаунта, пожалуйста, подтвердите ваш email адрес:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" class="button">
                  Подтвердить email
                </a>
              </div>
              
              <div class="info-box">
                <strong>Важно:</strong> Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:
                <div style="word-break: break-all; margin-top: 10px; font-size: 12px; color: #666;">
                  ${verificationUrl}
                </div>
              </div>
              
              <p>После подтверждения вы сможете войти в систему и начать использовать все возможности MedNAIS.</p>
              
              <div class="footer">
                <p>Если вы не регистрировались на MedNAIS, просто игнорируйте это письмо.</p>
                <p>&copy; ${new Date().getFullYear()} MedNAIS. Все права защищены.</p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Добро пожаловать в MedNAIS, ${name || "Пользователь"}!

Спасибо за регистрацию. Для активации аккаунта, пожалуйста, перейдите по ссылке:

${verificationUrl}

Если вы не регистрировались на MedNAIS, просто игнорируйте это письмо.

© ${new Date().getFullYear()} MedNAIS
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

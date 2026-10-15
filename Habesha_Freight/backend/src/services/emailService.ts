import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      dotenv.config({ override: true });

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = Number(process.env.SMTP_PORT) || 587;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASS;

      if (smtpHost && smtpUser && smtpPass) {
        if (smtpHost.includes('gmail')) {
          this.transporter = nodemailer.createTransport({
            service: 'gmail',
            pool: true,
            maxConnections: 5,
            maxMessages: 100,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });
        } else {
          this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpPort === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });
        }
      } else {
        this.transporter = nodemailer.createTransport({ jsonTransport: true });
      }
    }
    return this.transporter;
  }

  async sendOtpEmail(toEmail: string, otpCode: string, name?: string): Promise<boolean> {
    const fromAddress = process.env.SMTP_FROM || '"Habesha Freight" <noreply@habeshafreight.com>';
    const recipientName = name || 'Valued User';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 20px; }
          .card { max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-top: 5px solid #2563eb; }
          .header { text-align: center; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: bold; color: #1e293b; text-decoration: none; }
          .logo span { color: #2563eb; }
          .content { text-align: center; color: #475569; font-size: 15px; line-height: 1.6; }
          .otp-box { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e40af; padding: 16px; margin: 24px 0; text-align: center; }
          .footer { margin-top: 32px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="logo">Habesha <span>Freight</span></div>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Hello ${recipientName},</p>
            <p>Thank you for registering with Habesha Freight. Please use the verification code below to complete your registration:</p>
            <div class="otp-box">${otpCode}</div>
            <p>This code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Habesha Freight Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject: `🔐 Your Habesha Freight Verification Code: ${otpCode}`,
        html: htmlContent,
      });

      console.log(`📧 [EMAIL OTP DISPATCH] Sent OTP ${otpCode} to email ${toEmail}`);
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 [VIEW SENT EMAIL IN BROWSER]: ${previewUrl}`);
      }
      return true;
    } catch (error) {
      console.error(`❌ [EMAIL DISPATCH ERROR] Failed to send email to ${toEmail}:`, error);
      // Fallback console log so dev flow is never blocked
      console.log(`🔑 [FALLBACK OTP CODE]: ${otpCode} for ${toEmail}`);
      return false;
    }
  }
}

export const emailService = new EmailService();

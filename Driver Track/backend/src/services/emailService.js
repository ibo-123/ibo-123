import nodemailer from "nodemailer";

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

const transporter = SMTP_HOST
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    })
  : null;

async function sendEmail({ to, subject, text, html }) {
  if (!transporter) {
    console.info(
      "SMTP is not configured. Email content follows (development only):",
      { to, subject, text, html }
    );
    return;
  }

  await transporter.sendMail({
    from: EMAIL_FROM || `no-reply@localhost`,
    to,
    subject,
    text,
    html,
  });
}

export async function sendVerificationEmail(email, code) {
  await sendEmail({
    to: email,
    subject: "Verify your HabeshaFreight account",
    text: `Your HabeshaFreight verification code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your HabeshaFreight verification code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
  });
}

export async function sendResetCodeEmail(email, code) {
  await sendEmail({
    to: email,
    subject: "Reset your HabeshaFreight password",
    text: `Your HabeshaFreight password reset code is ${code}. It expires in 15 minutes.`,
    html: `<p>Your HabeshaFreight password reset code is <strong>${code}</strong>.</p><p>It expires in 15 minutes.</p>`,
  });
}

export default { sendVerificationEmail, sendResetCodeEmail };

import { BrevoClient } from "@getbrevo/brevo";

const apiKey = process.env.BREVO_API_KEY;

if (!apiKey) {
  console.error("❌ BREVO_API_KEY is missing");
}

const brevo = new BrevoClient({
  apiKey,
  timeoutInSeconds: 30,
  maxRetries: 2,
});

/**
 * Send a generic email using Brevo HTTP API
 */
export const sendEmail = async (to, subject, html, name = "") => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    if (!process.env.BREVO_SENDER_EMAIL) {
      throw new Error("BREVO_SENDER_EMAIL is not configured");
    }

    const result =
      await brevo.transactionalEmails.sendTransacEmail({
        sender: {
          name: process.env.BREVO_SENDER_NAME || "CodeTrack",
          email: process.env.BREVO_SENDER_EMAIL,
        },

        to: [
          {
            email: to,
            name: name || undefined,
          },
        ],

        subject,

        htmlContent: html,

        textContent: subject,
      });

    console.log(
      "✅ Email sent successfully:",
      result.messageId
    );

    return result;
  } catch (error) {
    console.error(
      "❌ Brevo email error:",
      error?.message || error
    );

    if (error?.statusCode) {
      console.error(
        "Brevo status:",
        error.statusCode
      );
    }

    if (error?.body) {
      console.error(
        "Brevo response:",
        error.body
      );
    }

    throw error;
  }
};


/**
 * Send verification OTP
 */
export const sendVerificationOtp = async (
  email,
  name,
  otp
) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CodeTrack Verification</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f1f5f9;
    font-family:Arial,Helvetica,sans-serif;
  "
>

  <div
    style="
      max-width:500px;
      margin:40px auto;
      background:#ffffff;
      padding:30px;
      border-radius:12px;
      box-shadow:0 4px 15px rgba(0,0,0,0.08);
    "
  >

    <h2
      style="
        color:#2563eb;
        margin-bottom:20px;
      "
    >
      Welcome to CodeTrack 🚀
    </h2>

    <p>
      Hello
      <strong>${name}</strong>,
    </p>

    <p>
      Thank you for creating your CodeTrack account.
    </p>

    <p>
      Use the verification code below
      to verify your email address:
    </p>

    <div
      style="
        text-align:center;
        margin:30px 0;
      "
    >

      <div
        style="
          display:inline-block;
          padding:18px 30px;
          background:#eff6ff;
          color:#2563eb;
          font-size:32px;
          font-weight:bold;
          letter-spacing:8px;
          border-radius:10px;
        "
      >
        ${otp}
      </div>

    </div>

    <p>
      This verification code will expire in
      <strong>10 minutes</strong>.
    </p>

    <p style="color:#64748b;">
      If you did not create a CodeTrack account,
      you can safely ignore this email.
    </p>

    <hr
      style="
        margin:30px 0;
        border:none;
        border-top:1px solid #e2e8f0;
      "
    >

    <p
      style="
        color:#94a3b8;
        font-size:12px;
        text-align:center;
      "
    >
      © ${new Date().getFullYear()} CodeTrack
    </p>

  </div>

</body>
</html>
`;

  return sendEmail(
    email,
    "Your CodeTrack verification code",
    html,
    name
  );
};
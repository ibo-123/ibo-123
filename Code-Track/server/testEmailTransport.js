import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import { getTransporter } from "./src/services/email.service.js";

async function testEmail() {
  console.log("EMAIL_USER loaded:", Boolean(process.env.EMAIL_USER));
  console.log("GMAIL_CLIENT_ID loaded:", Boolean(process.env.GMAIL_CLIENT_ID));
  console.log("GMAIL_REFRESH_TOKEN loaded:", Boolean(process.env.GMAIL_REFRESH_TOKEN));

  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "CodeTrack Gmail OAuth2 test",
      text: "If you receive this, Gmail OAuth2 email sending works.",
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Email test failed:", error);
    process.exit(1);
  }
}

testEmail();
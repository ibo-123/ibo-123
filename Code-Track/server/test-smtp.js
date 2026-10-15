import dns from "dns";

dns.setDefaultResultOrder("ipv4first");

import "dotenv/config";

import { sendEmail } from "./src/services/email.service.js";


await sendEmail(
  "your-real-email@gmail.com",
  "OAuth Test",
  "<h1>Gmail OAuth2 is working 🚀</h1>"
);


console.log("Done");
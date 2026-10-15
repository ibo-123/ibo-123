import dotenv from "dotenv";

import { google } from "googleapis";
import readline from "readline";


dotenv.config();
const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

console.log("CLIENT_ID:", process.env.GMAIL_CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.GMAIL_CLIENT_SECRET ? "Loaded" : "Missing");
console.log("REDIRECT_URI:", process.env.GMAIL_REDIRECT_URI);
const scopes = [
  "https://www.googleapis.com/auth/gmail.send"
];


const authUrl = oauth2Client.generateAuthUrl({
  access_type: "offline",
  scope: scopes,
  prompt: "consent"
});


console.log("\nOpen this URL in your browser:\n");
console.log(authUrl);


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});


rl.question(
  "\nPaste authorization code here: ",
  async(code)=>{

    try {

      const { tokens } =
        await oauth2Client.getToken(code);


      console.log("\nYour Refresh Token:\n");
      console.log(tokens.refresh_token);

    } catch(error){

      console.error(error);

    }

    rl.close();
  }
);
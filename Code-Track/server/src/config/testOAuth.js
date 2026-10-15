import dotenv from "dotenv";
import { google } from "googleapis";

dotenv.config();


const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);


oauth2Client.setCredentials({

  refresh_token: process.env.GMAIL_REFRESH_TOKEN

});


const token = await oauth2Client.getAccessToken();


console.log("ACCESS TOKEN:");
console.log(token.token);
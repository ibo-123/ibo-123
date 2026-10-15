import "dotenv/config";
import { google } from "googleapis";


const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);


oauth2Client.setCredentials({
  refresh_token: process.env.GMAIL_REFRESH_TOKEN,
});


try {

  const response = await oauth2Client.refreshAccessToken();

  console.log("ACCESS TOKEN:");
  console.log(response.credentials.access_token);

  console.log("SUCCESS");


} catch(error){

  console.log(error.response?.data || error.message);

}
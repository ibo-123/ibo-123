// import crypto from "crypto";

// /**
//  * Generates a secure random verification token.
//  *
//  * @returns {string}
//  */
// export const generateVerificationToken = () => {
//   return crypto.randomBytes(32).toString("hex");
// };

// /**
//  * Returns the expiration time for the verification token.
//  * Default: 24 hours from now.
//  *
//  * @returns {Date}
//  */
// export const generateVerificationExpiry = () => {
//   return new Date(Date.now() + 24 * 60 * 60 * 1000);
// };
import express from "express";

import authMiddleware from "../middlewares/auth.middleware.js";

import {
  connectCodeforces,
  getCodeforcesRatingHistory,
} from "../controller/codeforces.controller.js";


const router = express.Router();



router.post(
  "/connect",
  authMiddleware,
  connectCodeforces
);



router.get(
  "/history",
  authMiddleware,
  getCodeforcesRatingHistory
);



export default router;
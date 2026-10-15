import { Router } from "express";
import * as authController from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { registerValidator, loginValidator } from "../validators/authValidators.js";

const router = Router();

router.post("/register", registerValidator, authController.register);
router.post("/login", loginValidator, authController.login);
router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.getMe);

export default router;

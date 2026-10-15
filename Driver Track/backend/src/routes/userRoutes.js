import { Router } from "express";
import * as userController from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin"));

router.get("/", userController.listUsers);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.patch("/:id/status", userController.setUserActiveStatus);
router.post("/:id/reset-password", userController.resetPassword);
router.delete("/:id", userController.deleteUser);

export default router;

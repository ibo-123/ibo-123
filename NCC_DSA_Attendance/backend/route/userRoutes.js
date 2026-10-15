require("dotenv").config();
const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/profile", authMiddleware, userController.getUserProfile);
router.put("/profile", authMiddleware, userController.updateUserProfile);
router.get("/all", authMiddleware, roleMiddleware("admin"), userController.getAllUsers);
router.get("/:id", authMiddleware, roleMiddleware("admin"), userController.getUserById);
router.delete("/:id", authMiddleware, roleMiddleware("admin"), userController.deleteUser);

module.exports = router;

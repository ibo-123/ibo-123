const express = require("express");

const {
  register,
  login,
} = require("../controller/authController");

const router = express.Router();

router.get("/test", (req, res) => {
  res.json({
    message: "Auth routes are working",
  });
});

router.post("/register", register);

router.post("/login", login);

module.exports = router;
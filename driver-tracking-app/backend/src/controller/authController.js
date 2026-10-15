
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/User");

/*
|--------------------------------------------------------------------------
| Generate JWT
|--------------------------------------------------------------------------
*/

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // IMPORTANT:
      // Socket.IO tracking uses driverId.
      // For now use user._id as driver identity.
      driverId: user._id.toString(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

const register = async (req, res) => {
  try {
    console.log("📝 Register body:", req.body);

    const {
      name,
      email,
      password,
      role,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    if (!name || !email || !password) {
      return res.status(400).json({
        message:
          "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | Check existing user
    |--------------------------------------------------------------------------
    */

    const existingUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingUser) {
      return res.status(409).json({
        message:
          "An account with this email already exists.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Hash password
    |--------------------------------------------------------------------------
    */

    const hashedPassword =
      await bcrypt.hash(password, 10);

    /*
    |--------------------------------------------------------------------------
    | Create user
    |--------------------------------------------------------------------------
    */

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role:
        role === "driver"
          ? "driver"
          : "customer",
    });

    console.log(
      "✅ User registered:",
      user.email
    );

    /*
    |--------------------------------------------------------------------------
    | JWT
    |--------------------------------------------------------------------------
    */

    const token =
      generateToken(user);

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(201).json({
      message:
        "Registration successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "❌ Registration error:",
      error.message
    );

    console.error(
      error.stack
    );

    return res.status(500).json({
      message:
        "Server error during registration.",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : error.message,
    });
  }
};

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

const login = async (req, res) => {
  try {
    console.log("🔐 Login body:", {
      email: req.body?.email,
    });

    const {
      email,
      password,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | Validate
    |--------------------------------------------------------------------------
    */

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      email.trim().toLowerCase();

    /*
    |--------------------------------------------------------------------------
    | Find user
    |--------------------------------------------------------------------------
    */

    const user =
      await User.findOne({
        email: normalizedEmail,
      });

    if (!user) {
      console.log(
        "❌ User not found:",
        normalizedEmail
      );

      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Compare password
    |--------------------------------------------------------------------------
    */

    const passwordMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!passwordMatch) {
      console.log(
        "❌ Password does not match:",
        normalizedEmail
      );

      return res.status(401).json({
        message:
          "Invalid email or password.",
      });
    }

    /*
    |--------------------------------------------------------------------------
    | Generate JWT
    |--------------------------------------------------------------------------
    */

    const token =
      generateToken(user);

    console.log(
      "✅ Login successful:",
      user.email
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      message:
        "Login successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(
      "❌ Login error:",
      error.message
    );

    console.error(
      error.stack
    );

    return res.status(500).json({
      message:
        "Server error during login.",
      error:
        process.env.NODE_ENV ===
        "production"
          ? undefined
          : error.message,
    });
  }
};

module.exports = {
  register,
  login,
};

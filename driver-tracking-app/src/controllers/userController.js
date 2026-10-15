import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User, { ROLE_VALUES } from "../model/User.js";

/** GET /api/users - admin only. */
export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: users.length, data: users });
});

/** POST /api/users - admin creates a user of any role. */
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!ROLE_VALUES.includes(role)) throw new ApiError(400, `role must be one of: ${ROLE_VALUES.join(", ")}`);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, "An account with this email already exists.");

  const user = await User.create({ name, email, phone, password, role });
  res.status(201).json({ success: true, data: user.toSafeObject() });
});

/** PUT /api/users/:id - edit profile fields or change role. */
export const updateUser = asyncHandler(async (req, res) => {
  const allowedFields = ["name", "phone", "role", "profileImage"];
  const updates = {};
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  }
  if (updates.role && !ROLE_VALUES.includes(updates.role)) {
    throw new ApiError(400, `role must be one of: ${ROLE_VALUES.join(", ")}`);
  }

  const user = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw new ApiError(404, "User not found.");

  res.status(200).json({ success: true, data: user });
});

/** PATCH /api/users/:id/status - activate/deactivate a user. */
export const setUserActiveStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== "boolean") throw new ApiError(400, "isActive must be true or false.");

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { new: true });
  if (!user) throw new ApiError(404, "User not found.");

  res.status(200).json({ success: true, data: user });
});

/** POST /api/users/:id/reset-password - admin sets a temporary password. */
export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");

  const tempPassword = crypto.randomBytes(6).toString("hex");
  user.password = tempPassword;
  await user.save();

  // In production this would be emailed/SMS'd to the user rather than
  // returned in the API response.
  res.status(200).json({ success: true, data: { temporaryPassword: tempPassword } });
});

/** DELETE /api/users/:id - admin deletes a user account. */
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found.");
  res.status(200).json({ success: true, message: "User deleted." });
});

export default { listUsers, createUser, updateUser, setUserActiveStatus, resetPassword, deleteUser };

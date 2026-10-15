import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../model/User.js";
import Trip from "../model/Trip.js";

/** GET /api/customers - admin/dispatcher only. */
export const listCustomers = asyncHandler(async (req, res) => {
  const customers = await User.find({ role: "customer" }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: customers.length, data: customers });
});

/** GET /api/customers/:id - includes trip counts. */
export const getCustomer = asyncHandler(async (req, res) => {
  const customer = await User.findOne({ _id: req.params.id, role: "customer" });
  if (!customer) throw new ApiError(404, "Customer not found.");

  const [activeTrips, completedTrips, totalTrips] = await Promise.all([
    Trip.countDocuments({
      customerId: customer._id,
      status: { $in: ["created", "assigned", "tracking", "in_transit", "arrived"] },
    }),
    Trip.countDocuments({ customerId: customer._id, status: { $in: ["delivered", "completed"] } }),
    Trip.countDocuments({ customerId: customer._id }),
  ]);

  res.status(200).json({
    success: true,
    data: { customer, stats: { activeTrips, completedTrips, totalTrips } },
  });
});

export default { listCustomers, getCustomer };

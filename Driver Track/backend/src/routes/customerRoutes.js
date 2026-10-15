import { Router } from "express";
import * as customerController from "../controllers/customerController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

router.use(protect, authorize("admin", "dispatcher"));

router.get("/", customerController.listCustomers);
router.get("/:id", customerController.getCustomer);

export default router;

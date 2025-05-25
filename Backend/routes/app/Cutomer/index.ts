import express from "express"
import bookingRoutes from "./booking"
import authRoutes from "./auth"
import { getCustomerDetails } from "../../../controllers/app/Customer/booking";
import { CustomerMiddleware } from "../../../middlewares/middleware";

const router = express.Router();

router.use("/booking",bookingRoutes);
router.use("/auth",authRoutes);

router.get("/customerDetails",CustomerMiddleware,getCustomerDetails);
export default router;
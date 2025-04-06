import express from "express"
import bookingRoutes from "./booking"
import authRoutes from "./auth"

const router = express.Router();

router.use("/booking",bookingRoutes);
router.use("/auth",authRoutes);

export default router;
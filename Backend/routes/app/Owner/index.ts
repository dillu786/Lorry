import express from "express"
import bookingRoutes from "./booking"
import authRoutes from "./auth"
import vehicleRoutes from "./vehicleRoutes"
import driverRoutes from "./driver"

const router = express.Router();

router.use("/booking",bookingRoutes);
router.use("/auth",authRoutes);
router.use("/vehicle",vehicleRoutes);
router.use("/driver",driverRoutes);

export default router;
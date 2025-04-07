import express from "express"
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { getUserBookingHistory } from "../../../controllers/app/Customer/booking";
import { sendOtp, verifyOTP } from "../../../controllers/app/Owner/auth";
import { createAccount } from "../../../controllers/app/Customer/auth";

const router = express.Router();

router.post("/BookingHistory",CustomerMiddleware,getUserBookingHistory);
router.get("/getNegotiatedFares",CustomerMiddleware,getNegotiatedFares);

export default router;
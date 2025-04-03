import express from "express"
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { getBookingHistoryByuserId } from "../../../controllers/app/Customer/booking";
import { sendOtp, verifyOTP } from "../../../controllers/app/Owner/auth";
import { createAccount } from "../../../controllers/app/Customer/auth";

const router = express.Router();

router.post("/BookingHistory",CustomerMiddleware,getBookingHistoryByuserId);
router.post("/verifyOtp",verifyOTP);
router.post("/sendOtp",sendOtp);
router.post("/createAccount",CustomerMiddleware,createAccount);


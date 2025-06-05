import express from "express"
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { bookRide, cancelBooking, currentBooking, declineBooking, getFare, getNegotiatedFares, getUserBookingHistory } from "../../../controllers/app/Customer/booking";
import { sendOtp, verifyOTP } from "../../../controllers/app/Owner/auth";
import { createAccount } from "../../../controllers/app/Customer/auth";
import { acceptRide } from "../../../controllers/app/Driver/booking";

const router = express.Router();

router.post("/BookingHistory",CustomerMiddleware,getUserBookingHistory);
router.get("/getNegotiatedFares",CustomerMiddleware,getNegotiatedFares);
router.post("/bookRide",CustomerMiddleware,bookRide);
router.get("/getFare",CustomerMiddleware,getFare);
router.get("/currentBooking",CustomerMiddleware,currentBooking);    
router.post("/cancelBooking",CustomerMiddleware,cancelBooking);
router.post("/declineBooking",CustomerMiddleware,declineBooking);
router.post("/acceptRide",CustomerMiddleware,acceptRide);


            
export default router;
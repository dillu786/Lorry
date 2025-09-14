import express from "express"
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { bookRide, cancelBooking, currentBooking, declineBooking, getFare, getNegotiatedFares, getUserBookingHistory, acceptNegotiatedFare } from "../../../controllers/app/Customer/booking";
import { sendOtp, verifyOTP } from "../../../controllers/app/Owner/auth";
import { createAccount } from "../../../controllers/app/Customer/auth";

const router = express.Router();

router.post("/BookingHistory",CustomerMiddleware,getUserBookingHistory);
router.get("/getNegotiatedFares",CustomerMiddleware,getNegotiatedFares);
router.post("/bookRide",CustomerMiddleware,bookRide);
router.get("/getFare",CustomerMiddleware,getFare);
router.get("/currentBooking",CustomerMiddleware,currentBooking);    
router.post("/cancelBooking",CustomerMiddleware,cancelBooking);
router.post("/declineBooking",CustomerMiddleware,declineBooking);
router.post("/acceptRide",CustomerMiddleware,acceptNegotiatedFare);


            
export default router;
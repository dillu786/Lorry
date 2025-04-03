import express from "express"
import { Drivermiddleware } from "../../../middlewares/middleware";
import { acceptedBookings, acceptRide } from "../../../controllers/app/Driver/booking";
import { getBookingHistoryByuserId } from "../../../controllers/app/Customer/booking";
const router = express.Router();

router.post("/acceptRides",Drivermiddleware,acceptRide);
router.get("/accetedBooking",Drivermiddleware,acceptedBookings);
router.get("/historicalRides",Drivermiddleware,getBookingHistoryByuserId)
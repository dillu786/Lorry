import express from "express"
import { Drivermiddleware } from "../../../middlewares/middleware";
import { acceptedBookings, acceptRide, onGoingRide, completedRides, startTrip, makeDriverOnline, makeDriverOffline  } from "../../../controllers/app/Driver/booking";
import { getUserBookingHistory } from "../../../controllers/app/Customer/booking";
const router = express.Router();

router.post("/acceptRides",Drivermiddleware,acceptRide);
router.get("/accetedBooking",Drivermiddleware,acceptedBookings);
router.get("/historicalRides",Drivermiddleware,getUserBookingHistory);
router.get("/onGoingRide",Drivermiddleware,onGoingRide);
router.get("/completedRides",Drivermiddleware,completedRides);
router.get("/startTrip",Drivermiddleware,startTrip);
router.get("/makeDriverOnline",Drivermiddleware,makeDriverOnline);
router.get("/makeDriverOffline",Drivermiddleware,makeDriverOffline);

export default router;
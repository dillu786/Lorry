import express from "express"
import { Drivermiddleware } from "../../../middlewares/middleware";
import multer from "multer"
import { acceptedBookings, acceptRide, onGoingRide, completedRides, startTrip, makeDriverOnline, makeDriverOffline, negotiateFare, newBookings, endTrip  } from "../../../controllers/app/Driver/booking";
import { getUserBookingHistory } from "../../../controllers/app/Customer/booking";
const router = express.Router();
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
router.post("/startTrip",Drivermiddleware,upload.fields([{
    name :"productPhoto", maxCount: 1
}])

,startTrip);
router.post("/acceptRides",Drivermiddleware,acceptRide);
router.get("/accetedBooking",Drivermiddleware,acceptedBookings);
router.get("/historicalRides",Drivermiddleware,getUserBookingHistory);
router.get("/onGoingRide",Drivermiddleware,onGoingRide);
router.get("/completedRides",Drivermiddleware,completedRides);
router.patch("/makeDriverOnline",Drivermiddleware,makeDriverOnline);
router.patch("/makeDriverOffline",Drivermiddleware,makeDriverOffline);
router.post("/negotiateFare",Drivermiddleware,negotiateFare);
router.get("/newBookings",Drivermiddleware,newBookings);
router.post("/endTrip",Drivermiddleware,endTrip);

export default router;
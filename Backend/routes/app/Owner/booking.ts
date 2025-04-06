import express from "express";
import { OwnerMiddleware } from "../../../middlewares/middleware";
import { getLiveBooking,getCompletedBooking } from "../../../controllers/app/Owner/booking";

const router = express.Router();

router.get("/liveBooking",OwnerMiddleware,getLiveBooking);
router.get("/completedBooking",OwnerMiddleware,getCompletedBooking);

export default router;
import express from "express"
import { resetPassword,sendOtp,signIn, verifyOTP } from "../../../controllers/app/Driver/auth";
import { Drivermiddleware } from "../../../middlewares/middleware";

const router = express.Router();

router.post("/resetPassword",Drivermiddleware,resetPassword);
router.post("/signIn",signIn);
router.post("/verifyOtp",verifyOTP);
router.post("/sendOtp",sendOtp);
export default router;
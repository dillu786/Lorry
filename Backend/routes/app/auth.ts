import express from "express";
const router = express.Router();
import { register,sendOtp,verifyOTP } from "../../controllers/app/auth";
import { middleware } from "../../middlewares/middleware";
router.post("/addRegistration",middleware, register);
router.post("/verifyOtp",verifyOTP);
router.post("/sendOtp",sendOtp)
export default router;
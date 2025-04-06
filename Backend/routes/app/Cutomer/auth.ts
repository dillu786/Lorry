import express from "express"
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { createAccount } from "../../../controllers/app/Customer/auth";

import { sendOtp, verifyOTP } from "../../../controllers/app/Owner/auth";

const router = express.Router();

router.post("/verifyOtp",verifyOTP);
router.post("/sendOtp",sendOtp);
router.post("/createAccount",createAccount);

export default router;
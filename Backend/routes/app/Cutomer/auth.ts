import express from "express"
import { CustomerMiddleware } from "../../../middlewares/middleware";
import { createAccount } from "../../../controllers/app/Customer/auth";

import {  signIn, signUp, verifyOTP } from "../../../controllers/app/Customer/auth";

const router = express.Router();

router.post("/verifyOtp",verifyOTP);
//router.post("/sendOtp",sendOtp);
router.post("/createAccount",createAccount);
router.post("/signIn",signIn);
router.post("/signUp",signUp);

export default router;
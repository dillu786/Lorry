import express from "express"
import { resetPassword,sendOtp,signIn, verifyOTP,verifyOtpOnPasswordReset, getDocumentVerificationStatus, deleteAccount } from "../../../controllers/app/Driver/auth";
import { Drivermiddleware } from "../../../middlewares/middleware";

const router = express.Router();

router.post("/resetPassword",Drivermiddleware,resetPassword);
router.post("/verifyOtpOnPasswordReset",verifyOtpOnPasswordReset);
router.post("/signIn",signIn);
router.post("/verifyOtp",verifyOTP);
router.post("/sendOtp",sendOtp);
router.get("/document-verification-status", Drivermiddleware, getDocumentVerificationStatus);
router.delete("/delete-account",Drivermiddleware, deleteAccount);
export default router;
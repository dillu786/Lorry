import express from "express";
import multer from "multer";
import { resetPassword,verifyOtpOnPasswordReset, sendOtp,verifyOTP, deleteAccount, raiseDeleteRequest } from "../../../controllers/app/Owner/auth";
import { OwnerMiddleware } from "../../../middlewares/middleware";
import { uploadDocument } from "../../../controllers/app/Owner/auth";
import { signUp,signIn,register } from "../../../controllers/app/Owner/auth";

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const router = express.Router();

// Define the POST route for adding a vehicle
//router.post('/addVehicle',upload.single('VehicleImage'), addVehicle);


//router.post("/addRegistration",AuthVerify, register);
router.post("/signup",signUp);
router.post("/signin",signIn);
router.post("/verifyOtp",verifyOTP);
router.post("/verifyOtpOnPasswordReset",verifyOtpOnPasswordReset);
router.post("/sendOtp",sendOtp);
router.post("/resetPassword",OwnerMiddleware,resetPassword);
router.post("/register",OwnerMiddleware,upload.single('OwnerImage'),register);
router.post("/uploadDoc",OwnerMiddleware,
    upload.fields([
    { name: 'FrontAadhar',maxCount:1},
    { name: 'BackAadhar',maxCount:1},
    {name: 'Pan',maxCount:1}
]),
uploadDocument);
router.delete("/delete-account", OwnerMiddleware, deleteAccount);
router.post("/raise-delete-request", OwnerMiddleware, raiseDeleteRequest);
export default router;
import express from "express";
import multer from "multer";
import { resetPassword, sendOtp,verifyOTP } from "../../../controllers/app/Owner/auth";
import { middleware as AuthVerify } from "../../../middlewares/middleware";
import { uploadDocument } from "../../../controllers/app/Owner/auth";
import { signUp,signIn } from "../../../controllers/app/Owner/auth";
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const router = express.Router();

// Define the POST route for adding a vehicle
//router.post('/addVehicle',upload.single('VehicleImage'), addVehicle);


//router.post("/addRegistration",AuthVerify, register);
router.post("/signup",signUp);
router.post("/signin",signIn);
router.post("/verifyOtp",verifyOTP);
router.post("/sendOtp",sendOtp);
router.post("/resetPassword",AuthVerify,resetPassword);
router.post("/uploadDoc",AuthVerify,upload.fields([
    { name: 'FrontAadhar',maxCount:1},
    { name: 'BackAadhar',maxCount:1},
    {name: 'Pan',maxCount:1}
]),uploadDocument);
export default router;
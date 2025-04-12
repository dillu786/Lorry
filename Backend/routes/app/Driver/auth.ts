import express from "express"
import { resetPassword,signIn } from "../../../controllers/app/Driver/auth";
import { Drivermiddleware } from "../../../middlewares/middleware";

const router = express.Router();

router.post("/resetPassword",Drivermiddleware,resetPassword);
router.post("/signIn",signIn);

export default router;
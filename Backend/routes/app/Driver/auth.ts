import express from "express"
import { resetPassword,signIn } from "../../../controllers/app/Driver/auth";

const router = express.Router();

router.post("/resetPassword",resetPassword);
router.post("/signIn",signIn);

export default router;
import express from "express"
import { resetPassword } from "../../../controllers/app/Owner/auth";

const router = express.Router();

router.post("/resetPassword",resetPassword)
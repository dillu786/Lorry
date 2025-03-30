import express from "express"
import { middleware } from "../../../middlewares/middleware";
import { getAllDriverByOwnerId } from "../../../controllers/app/Owner/driver";


const router = express.Router();

router.get("/ownerDrivers",middleware,getAllDriverByOwnerId);
export default router;
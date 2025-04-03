import express from "express"
import { OwnerMiddleware } from "../../../middlewares/middleware";
import { getAllDriverByOwnerId } from "../../../controllers/app/Owner/driver";


const router = express.Router();

router.get("/ownerDrivers",OwnerMiddleware,getAllDriverByOwnerId);
export default router;
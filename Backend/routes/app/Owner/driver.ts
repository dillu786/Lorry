import express from "express"
import { OwnerMiddleware } from "../../../middlewares/middleware";
import { getAllDriverByOwnerId,addDriver,assignVehicleToDriver} from "../../../controllers/app/Owner/driver";


const router = express.Router();

router.get("/ownerDrivers",OwnerMiddleware,getAllDriverByOwnerId);
router.post("/addDriver",OwnerMiddleware,addDriver);
router.post("/assignVehicleToDriver",OwnerMiddleware,assignVehicleToDriver);
//router.get("/driverDetails",OwnerMiddleware,getDriverDetails);
//router.put("/updateDriver",OwnerMiddleware,updateDriver);
//router.delete("/deleteDriver",OwnerMiddleware,deleteDriver);
export default router;
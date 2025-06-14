import express from 'express';
import { addVehicle, getAllVehiclesByOwnerId, getVehicleByVehicleId,updateVehicleByVehicleId } from '../../../controllers/app/Owner/vehicle';
import multer from 'multer';
import uploadMiddleware from '../../../middlewares/uploadmiddleware';
import { OwnerMiddleware } from '../../../middlewares/middleware';
import type { Request,Response } from 'express';
import { addDriver } from '../../../controllers/app/Owner/driver';
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const router = express.Router();

// Define the POST route for adding a vehicle
//router.post('/addVehicle',upload.single('VehicleImage'), addVehicle);

router.post('/addVehicle', OwnerMiddleware,upload.fields([
    { name: 'VehicleImage', maxCount: 1 },
    { name: 'VehicleInsuranceImage', maxCount: 1 },
    { name: 'PermitImage', maxCount: 1 }
  ]), addVehicle);
router.post('/addDriver',OwnerMiddleware,upload.fields([
    {name: 'driverImage',maxCount:1},
    {name: 'licenseImageFront',maxCount:1},
    {name: 'licenseImageBack',maxCount:1},
    {name: 'aadharImageFront',maxCount:1},
    {name: 'aadharImageBack',maxCount:1},
    {name: 'panImage',maxCount:1}
]),addDriver)

router.get("/ownerVehicles",OwnerMiddleware,getAllVehiclesByOwnerId);
router.get("/vehicleDetails",OwnerMiddleware,getVehicleByVehicleId);
router.patch("/updateVehicle",OwnerMiddleware,upload.fields([
  { name: 'VehicleImage', maxCount: 1 },
  { name: 'VehicleInsuranceImage', maxCount: 1 },
  { name: 'PermitImage', maxCount: 1 }]),updateVehicleByVehicleId);

export default router;

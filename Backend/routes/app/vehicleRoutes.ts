import express from 'express';
import { addVehicle } from '../../controllers/app/vehicle';
import uploadMiddleware from '../../middlewares/uploadmiddleware';

const router = express.Router();

// Define the POST route for adding a vehicle
router.post('/add', uploadMiddleware, addVehicle);

export default router;

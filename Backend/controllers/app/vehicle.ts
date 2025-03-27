import type { Request, Response } from 'express';
import { S3 } from 'aws-sdk';
import { vehicleSchema } from '../../types/vehicletypes';
import { generatePresignedUrl } from '../../utils/s3utils';
import z from "zod"

const s3 = new S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

// Vehicle data structure
interface VehicleData {
  Model: string;
  Year: Date;
  Category: string;
  VehicleImage: string;
  VehicleInsuranceImage: string;
  PermitImage: string;
}

// Controller to add a vehicle
export const addVehicle = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract file keys from the S3 response
    //@ts-ignore
    const vehicleImageKey = req.files!.VehicleImage[0].key;
    //@ts-ignore
    const vehicleInsuranceImageKey = req.files!.VehicleInsuranceImage[0].key;
    //@ts-ignore
    const permitImageKey = req.files!.PermitImage[0].key;

    // Prepare the vehicle data
    const vehicleData: VehicleData = {
      ...req.body,
      VehicleImage: vehicleImageKey,
      VehicleInsuranceImage: vehicleInsuranceImageKey,
      PermitImage: permitImageKey,
    };

    // Validate the input data using Zod
    vehicleSchema.parse(vehicleData);

    // Simulate saving to a database (you can replace this with actual DB logic)
    // await VehicleModel.create(vehicleData);

    res.status(200).json({
      message: 'Vehicle added successfully!',
      vehicleData: vehicleData,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Invalid input data', details: error.errors });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

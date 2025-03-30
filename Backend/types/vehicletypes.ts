
import z from "zod";

export const vehicleSchema = z.object({
  Model: z.string(),
  Year: z.string(),
  Category: z.string(),
  VehicleNumber:z.string()
 
});

export const updateVehicleSchema = z.object({
  Id: z.number(),
  Model: z.string(),
  Year: z.string(),
  Category: z.string(),
  VehicleNumber:z.string()
 
});

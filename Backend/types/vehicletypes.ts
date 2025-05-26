
import { VehicleModule } from "@faker-js/faker";
import { VehicleType } from "@prisma/client";
import z from "zod";
import { VehicleTypes } from "./Common/types";

export const vehicleSchema = z.object({
  Model: z.string(),
  Year: z.string(),
  VehicleNumber:z.string(),
  VehicleType: z.enum(VehicleTypes)
}); 

export const updateVehicleSchema = z.object({
  Id: z.string(),
  Model: z.string(),
  Year: z.string(),
  Category: z.string(),
  VehicleNumber:z.string()
 
});


import z from "zod";

export const vehicleSchema = z.object({
  Model: z.string(),
  Year: z.date(),
  Category: z.string(),
  VehicleImage: z.string(),
  VehicleInsuranceImage: z.string(),
  PermitImage: z.string(),
});

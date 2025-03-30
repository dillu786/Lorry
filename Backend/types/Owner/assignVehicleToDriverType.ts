import {number, z} from "zod"

export const assignVehicleToDriverSchema = z.object({
    VehicleId: z.number(),
    DriverId:z.number()
})
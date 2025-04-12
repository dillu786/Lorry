import {number, z} from "zod"

export const assignVehicleToDriverSchema = z.object({
    vehicleId: z.number(),
    driverId:z.number()
})
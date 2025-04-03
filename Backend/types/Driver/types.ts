import {z} from "zod"

export const acceptRideSchema = z.object({
    DriverId: z.number(),
    VehicleId: z.number(),
    BookingId: z.number()

})
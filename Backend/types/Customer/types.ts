import {z} from "zod"

export const bookRideSchema = z.object({
    PickUpLocation: z.string(),
    DropLocation: z.string(),
    PickupLatitude: z.string(),
    DropLongitude: z.string(),
    PickupLogitude: z.string(),
    DropLatitude: z.string(),
    Product: z.string(),
    Distance: z.string(),
    Fare: z.string(),
    PaymentMode: z.enum(["CASH", "ONLINE"]),
    StartTime: z.string().datetime(),
    EndTime: z.string().datetime().optional()
})

export const negotiateFareSchema = z.object({
    BookingId: z.number(),
    DriverId: z.number(),
    OwnerId: z.number(),
    NegotiatedFare: z.string()
})

export const acceptNegotiatedFareSchema = z.object({
    BookingId: z.number(),
    DriverId: z.number(),
    OwnerId: z.number()
}) 
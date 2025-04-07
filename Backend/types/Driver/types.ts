import {z} from "zod"

export const acceptRideSchema = z.object({
    DriverId: z.number(),
    VehicleId: z.number(),
    BookingId: z.number()
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

export const bookRideSchema = z.object({
    PickUpLocation: z.string(),
    DropLocation: z.string(),
    Product: z.string(),
    Distance: z.string(),
    Fare: z.string(),
    PaymentMode: z.enum(["CASH", "ONLINE"]),
    StartTime: z.string().datetime(),
    EndTime: z.string().datetime()
})
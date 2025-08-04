import {z} from "zod"

export const acceptRideSchema = z.object({
    DriverId: z.number(),
    VehicleId: z.number(),
    BookingId: z.number(),
    Fare:z.string()
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

export const makeDriverOnlineSchema = z.object({
    Latitude: z.string(),
    Longitude: z.string()
})

// DocumentImageKey type for DriverDocument table - references Driver table image fields
export const DocumentImageKeySchema = z.enum([
    "FrontSideAdhaarImage",
    "BackSideAdhaarImage", 
    "DrivingLicenceFrontImage",
    "DrivingLicenceBackImage",
    "PanImage"
])

export type DocumentImageKey = z.infer<typeof DocumentImageKeySchema>

// Schema for creating/updating driver documents
export const createDriverDocumentSchema = z.object({
    driverId: z.number(),
    DocumentImageKey: DocumentImageKeySchema,
    IsApproved: z.boolean().default(false)
})

export const updateDriverDocumentSchema = z.object({
    id: z.string(),
    IsApproved: z.boolean().optional()
})

// Schema for checking driver document verification status
export const driverDocumentVerificationSchema = z.object({
    IsDLFrontImageVerified: z.boolean(),
    IsDLBackImageVerified: z.boolean(),
    IsFSAdhaarImgVerified: z.boolean(),
    IsBSAdhaarImgVerified: z.boolean(),
    IsPanImgVerified: z.boolean()
})

// Utility function to check if all documents are verified
export const areAllDocumentsVerified = (driver: any): boolean => {
    return driver.IsDLFrontImageVerified && 
           driver.IsDLBackImageVerified && 
           driver.IsFSAdhaarImgVerified && 
           driver.IsBSAdhaarImgVerified && 
           driver.IsPanImgVerified;
}
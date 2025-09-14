import {z} from "zod"

export const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be valid (e.g., +1234567890)");
export const otpSchema = z.object({
  MobileNumber : phoneSchema
})

export const verifyOtpSchema = z.object({
  MobileNumber: phoneSchema,
  Otp: z.string()
})

// types.ts
export interface DriverLocation {
  lat: number;
  lng: number;
  driverId: string;
}

export interface RideRequest {
  Name: string;
  pickupLat: number;
  pickupLng: number;
  DropLat: number;
  DropLng: number;
  PickUpLocation: string;
  DropLocation: string;
  Distance: string;
  Fare: string;
  StartTime: string;
  PaymentModde: string;
  Product: string;
  Vehicle?: string;
  
}

export const VehicleTypes = [
  "CARGO_CAR",
  "MINI_TRUCK",
  "PICKUP_TRUCK",
  "TANK_CAR",
  "LCV",
  "HCV"
] as const;



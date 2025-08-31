import { Gender } from "@prisma/client";
import {z} from "zod"

export const nameSchema = z.string().min(1, "Name is required").regex(/^[A-Za-z0-9\s]+$/, "Name can only contain letters, digits and spaces");
export const phoneSchema = z.string()
  .min(10, "Phone number must be at least 10 digits")
  .regex(/^\+?[1-9]\d{1,14}$/, "Phone number must be valid (e.g., +1234567890)");

export const signupSchema = z.object({
  name: nameSchema.optional(),
  mobileNumber: phoneSchema,
  password: z.string().min(4),
  dob:z.date().optional(),
  aadharCardNo:z.number().min(12).optional(),
  gender: z.enum(["MALE","FEMALE"])
});
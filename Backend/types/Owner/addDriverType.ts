import {z} from "zod"
import { nameSchema, phoneSchema } from "../signupTypes"
export const addDriverSchema = z.object({
    Name: nameSchema,
    DrivingLicense: z.string(),
    MobileNumber: phoneSchema,
    AadharNumber: z.string().optional(),
    PanNumber: z.string().optional(),
    Gender: z.enum(["MALE","FEMALE"]),
    Password: z.string()

})
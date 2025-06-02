import {z} from "zod"
import { nameSchema, phoneSchema } from "../signupTypes"
export const addDriverSchema = z.object({
    Name: nameSchema,
    DrivingLicense: z.string(),
    MobileNumber: phoneSchema,
    AadharNumber: z.string(),
    PanNumber: z.string(),
    Gender: z.enum(["MALE","FEMALE"]),
    Password: z.string()

})
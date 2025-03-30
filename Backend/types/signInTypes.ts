import {z } from "zod"
import { phoneSchema } from "./signupTypes"
export const signInSechema = z.object({
    MobileNumber: phoneSchema,
    password:z.string().min(4)
})
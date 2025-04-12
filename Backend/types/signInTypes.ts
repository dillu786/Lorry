import {z } from "zod"
import { phoneSchema } from "./signupTypes"
export const signInSechema = z.object({
    mobileNumber: phoneSchema,
    password:z.string().min(4)
})
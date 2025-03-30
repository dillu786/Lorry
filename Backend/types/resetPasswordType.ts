import {z} from "zod";
import { phoneSchema } from "./signupTypes";

export const resetPasswordSchema = z.object({
    MobileNumber: phoneSchema,
    Password: z.string()
});

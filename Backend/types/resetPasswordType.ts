import {z} from "zod";
import { phoneSchema } from "./signupTypes";

export const resetPasswordSchema = z.object({
    password: z.string()
});

import {z} from "zod"

export const registerSchema = z.object({
    Name: z.string(),
    Email : z.string(),
    Dob: z.string(),
    Gender: z.enum(["MALE","FEMALE"]),
    AdhaarCardNumber: z.string()
})

    

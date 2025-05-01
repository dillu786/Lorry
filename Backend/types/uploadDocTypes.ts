import {z} from "zod"
export const uploadDocSchema = z.object({
    AadharNumber : z.string(),
    PanNumber:z.string()

})


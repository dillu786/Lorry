import {z} from "zod"
export const uploadDocSchema = z.object({
    AadharNumber : z.string(),
    FrontAdharImage:z.string(),
    BackAdharImage:z.string(),
    PanImage:z.string()

})


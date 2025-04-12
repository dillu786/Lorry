import express from "express"
import bookingRoutes from "./booking"
import authRoutes from "./auth"
import { responseObj } from "../../../utils/response";
import { Drivermiddleware } from "../../../middlewares/middleware";
import type{Request,Response} from "express"
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();
const app = express();
app.use(express.json());
router.get("/dashboard",Drivermiddleware,async (req:Request,res:Response):Promise<any>=>{
    try{
        const driverId = req.user.Id;
        const driver = await prisma.driver.findUnique({
            where:{
                Id: driverId
            },
            include:{       
                DriverVehicles:true,
                Bookings:true
            }
        })
        res.status(200).json(responseObj(true,driver,"Dashboard"));
    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"+error));
    }
})
router.use("/booking",bookingRoutes);
router.use("/auth",authRoutes);

export default router;
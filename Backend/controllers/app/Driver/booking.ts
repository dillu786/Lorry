import type { Request,Response } from "express"
import { PrismaClient } from "@prisma/client"
import { responseObj } from "../../../utils/response";
import { acceptRideSchema } from "../../../types/Driver/types";

const prisma = new PrismaClient();
export const newBookings = async (req:Request, res: Response):Promise<any> => {
try{

    const newBookings = await prisma.bookings.findMany({
        where:{
            Status: "Pending"
        }
    });
     
    res.status(200).json(responseObj(true,newBookings,"Succefully Fetched"));

}
catch(error:any){

    res.status(500).json(responseObj(false,null,"Something went wrong"));
}
}



export const acceptedBookings = async (req: Request,res: Response): Promise<any> =>{
    try{

        const driverId = req.params.driverId as string;
        if(driverId == ""|| driverId == null || driverId == undefined){
            res.status(411).json(responseObj(false,null,"Incorrect Input"));
        }
        const acceptedBookings = await prisma.bookings.findMany({
            where:{
                Status:"Confirmed",
                DriverId: parseInt(driverId)
            }
        })

        res.status(200).json(responseObj(true,acceptedBookings,"Succefully Fetched"));

    }

    catch(error: any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

export const completedRides = async (req:Request,res:Response):Promise<any> =>{

    try{

        const driverId = req.query.driverId as string;
    
        if(driverId == ""|| driverId == null || driverId == undefined){
            res.status(411).json(responseObj(false,null,"Incorrect Input"));
        }
    
        const completedRides = await prisma.bookings.findMany({
           where:{
            DriverId : parseInt(driverId),
            Status : "Completed"
           }
           
        }
        )
    
        res.status(200).json(responseObj(true,completedRides,""));
    }

    catch(error: any){
        res.status(500).json(responseObj(false,null,""));
    }

}

export const onGoingRide = async (req: Request, res: Response): Promise<any> =>{

    try{

        //@ts-ignore
        const driverId = req.user.Id as string;
    
       
        const onGoingRide = await prisma.bookings.findFirst({
            where:{
                DriverId : parseInt(driverId),
                Status:"Ongoing"
            }
        })

        return res.status(200).json(responseObj(true,onGoingRide,""));
    }

    catch(error : any){
        return res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

export const startTrip = async (req:Request, res: Response):Promise<any> =>{

    try{
        const bookingId = req.query.bookingId as string;
    
        if(bookingId == ""|| bookingId == null || bookingId == undefined){
            res.status(411).json(responseObj(false,null,"Incorrect Input"));
        }

        await prisma.bookings.update({
            where:{
                Id: parseInt(bookingId)
            },
            data:{
                Status:"Ongoing"
            }
        })
        res.status(200).json(responseObj(true,null,""));
        
    }
    catch{
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

export const acceptRide = async (req:Request, res:Response):Promise<any>=>{

    try{

        const parsedBody = acceptRideSchema.safeParse(req.body);
    
        if(!parsedBody.success){
            res.status(411).json(responseObj(false,"Incorrect Input",parsedBody.error as any))
        }
    
        const booking = await prisma.bookings.findFirst({
            where:{
                Id: parsedBody.data?.BookingId
            }
        })
    
        if(!booking){
            res.status(411).json(responseObj(false,null,"BookingId does not exist"));
    
        }
    
        await prisma.bookings.update({
            where:{
                Id: parsedBody.data?.BookingId
            },
            data:{
                DriverId: parsedBody.data?.DriverId,
                VehicleId: parsedBody.data?.VehicleId,
                Status: "Confirmed",
                UpdatedDateTime: Date.now() as any
            }
        })
    
        res.status(200).json(responseObj(true,null,""));
    }

    catch(error: any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

export const makeDriverOnline = async (req:Request, res:Response): Promise<any> =>{
    try{
        //@ts-ignore
        const driverId = req.user.Id as string;
        await prisma.driver.update({
            where:{
                Id: parseInt(driverId)
            },
            data:{
                IsOnline: true
            }
        })
        res.status(200).json(responseObj(true,null,""));
        }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

export const makeDriverOffline = async (req:Request, res:Response): Promise<any> =>{
    try{
        //@ts-ignore
        const driverId = req.user.Id as string;
        await prisma.driver.update({
            where:{
                Id: parseInt(driverId)
            },
            data:{
                IsOnline: false     
            }
        })
        res.status(200).json(responseObj(true,null,""));
    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}


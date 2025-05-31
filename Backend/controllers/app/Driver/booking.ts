import type { Request,Response } from "express"
import { PrismaClient, type Bookings } from "@prisma/client"
import { responseObj } from "../../../utils/response";
import { acceptRideSchema, makeDriverOnlineSchema } from "../../../types/Driver/types";
import { negotiateFareSchema } from "../../../types/Driver/types";
import { getObjectSignedUrl } from "../../../utils/s3utils";
import { parse } from "path";
import { haversineDistance } from "../../../utils/haversine";
const prisma = new PrismaClient();
export const newBookings = async (req:Request, res: Response):Promise<any> => {
try{

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, parseInt(req.query.limit as string) || 10); // cap limit at 100
    const driverLatitude = req.query.driverLatitude;
    const driverLongitude = req.query.driverLongitude;  
    if(!driverLatitude || !driverLongitude){

        return res.status(400).json({
            message : "Send Driver latitude and Longitude"
        });
    }
    
    const newBookings = await prisma.bookings.findMany({
        where:{
            Status: "Pending"
        },
        orderBy: {
            UpdatedDateTime: 'desc'
        },
        skip: (page-1)* limit,
        take: limit
    });
    const response:Bookings[] = []
    newBookings.forEach((booking)=>{
        const distance = haversineDistance(Number(driverLatitude),Number(driverLongitude),booking.PickUpLatitude,booking.PickUpLongitude)
        if(distance <= 20 ){
            response.push(booking)
        }
    });
     
    return res.status(200).json(responseObj(true,response,"Succefully Fetched"));

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

        //@ts-ignore
        const driverId = req.user.Id as string;
    
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
        console.log("req.body",req.body);
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
    
       const acceptedBooking = await prisma.bookings.update({
            where:{
                Id: parsedBody.data?.BookingId
            },
            data:{
                DriverId: parseInt((parsedBody.data?.DriverId as unknown as string)),
                VehicleId: parseInt((parsedBody.data?.VehicleId as unknown as string)),
                Status: "Confirmed",
                Fare: parsedBody.data?.Fare ,         
                UpdatedDateTime: new Date().toISOString()
            }
        })
    
        res.status(200).json(responseObj(true,acceptedBooking,""));
    }

    catch(error: any){
        res.status(500).json(responseObj(false,null,"Something went wrong"+error));
    }
}

export const getDriverDetails = async (req:Request, res:Response): Promise<any> =>{
    try{

        const driverId = req.user.Id;
        let driver = await prisma.driver.findFirst({
            where:{
                Id: parseInt(driverId as unknown as string)
            },
            select:{
                Name:true,
                MobileNumber: true,
                Id:true,
                DOB: true,
                DrivingLicenceNumber:true,
                DriverImage:true,
                DrivingLicenceBackImage: true,
                DrivingLicenceFrontImage: true,
                DriverOwner:{
                    select:{
                        OwnerId:true
                    }
                },
                DriverVehicles:{
                    select:{
                        VehicleId:true      
                    }
                }
            },
          
        });

        if(!driver){
            res.status(400).json(responseObj(false,null,"Driver not found"));
        }

        if(driver){
            driver.DriverImage = await getObjectSignedUrl(driver?.DriverImage as string);
            driver.DrivingLicenceFrontImage = await getObjectSignedUrl(driver?.DrivingLicenceFrontImage as string);
            driver.DrivingLicenceBackImage = await getObjectSignedUrl(driver?.DrivingLicenceBackImage as string);
            res.status(200).json(responseObj(true,driver,"successfully fetched"));
        }
     
    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,error as any))
    }

    
}

export const makeDriverOnline = async (req:Request, res:Response): Promise<any> =>{
    try{
        //@ts-ignore
        const driverId = req.user.Id as string;
        const parsedBody = makeDriverOnlineSchema.safeParse(req.body);
        if(!parsedBody.success){
            res.status(411).json(responseObj(false,null,parsedBody.error as any))
        }
        console.log("parsedBody"+JSON.stringify(parsedBody));
        await prisma.driver.update({
            where:{
                Id: parseInt(driverId),           
            },
            data:{
                IsOnline: true,
                Latitude: parseFloat(parsedBody.data?.Latitude as string),
                Longitude: parseFloat(parsedBody.data?.Longitude as string)
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

export const negotiateFare = async (req:Request, res:Response): Promise<any> =>{
    try{
        const parsedBody = negotiateFareSchema.safeParse(req.body);
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

            await prisma.fareNegotiation.create({
                data:{
                    BookingId: parsedBody.data?.BookingId as number,
                    DriverId: parsedBody.data?.DriverId as number,
                    OwnerId: parsedBody.data?.OwnerId as number,
                    NegotiatedFare: parsedBody.data?.NegotiatedFare as string,
                    NegotiatedTime: new Date(Date.now())
                }           
        })

        res.status(200).json(responseObj(true,null,""));
    }   
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"+error));
    }
}


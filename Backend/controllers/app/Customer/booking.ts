import express from "express"
import type { Request,Response } from "express";
import { PaymentMode, Prisma, PrismaClient, VehicleType } from "@prisma/client"
import { responseObj } from "../../../utils/response";
import { acceptNegotiatedFareSchema, bookRideSchema } from "../../../types/Customer/types";
import { notifyNearbyDrivers } from "../../..";
import type { RideRequest } from "../../../types/Common/types";
        import { declineBookingSchema } from "../../../types/Customer/types";
const prisma = new PrismaClient();

export const    declineBooking = async (req: Request, res: Response): Promise<any>=>{
    try{
        //@ts-ignore
        const parsedBody = declineBookingSchema.safeParse(req.body);
        if(!parsedBody.success){
            return res.status(400).json(responseObj(false,null,"Invalid Input"));
        }
        const [booking,driver] = await Promise.all([
            prisma.bookings.findFirst({
                where:{
                    Id: parsedBody.data.BookingId
                }
            }),
            prisma.user.findFirst({
                where:{
                    Id: parsedBody.data.DriverId
                }
            })
        ])
        if(!booking){
            return res.status(400).json(responseObj(false,null,"Booking not found"));
        }
        if(!driver){
            return res.status(400).json(responseObj(false,null,"Driver not found"));
        }
        
        await prisma.fareNegotiation.update({
            where: {
              BookingId_DriverId: {
                BookingId: parsedBody.data.BookingId,
                DriverId: parsedBody.data.DriverId // Or whatever identifies the current user
              },
            },
            data: {
              Status: "Declined", // Ensure this matches your enum exactly (case-sensitive!)
            },
          });
          
        res.status(200).json(responseObj(true,null,"Booking Declined Successfully"));
    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"+error));
    }
}
export const cancelBooking = async (req: Request, res: Response): Promise<any>=>{
    try{
        //@ts-ignore
        const bookingId = req.query.bookingId;
        const mobileNumber = req.user.MobileNumber;
        const user = req.user;
        await prisma.bookings.update({
            where:{
                Id: Number(bookingId),
                UserId: Number(user.Id)
            },
            data:{
                Status: "Cancelled"
            }
        })
        res.status(200).json(responseObj(true,null,"Booking Cancelled Successfully"));
    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"+error));
    }
}
export const currentBooking = async (req: Request, res: Response): Promise<any>=>{
    try{
        //@ts-ignore
        const mobileNumber = req.user.MobileNumber;
        const user = await prisma.user.findFirst({ 
            where:{
                MobileNumber: mobileNumber
            }
        })

        if(!user){
            return res.status(400).json(responseObj(false,null,"User not found"));
        }
        
        
        const bookings = await prisma.bookings.findMany({
            where:{
                UserId: Number(user.Id),
                Status: "Pending"
            },
        
            include:{
                Driver:{
                    select:{
                        Name:true
    
                    }
                },
                Vehicle:{
                  select:{
                    Model: true
                  }
                }
            },
        });

        res.status(200).json(responseObj(true,bookings,"Bookings Successfully Fetched"));
}
catch(error: any){
    res.status(500).json(responseObj(true,null,"Something went wrong"+error ));
}
}

export const bookRide = async (req:Request, res:Response): Promise<any>=>{
        try{
        //@ts-ignore
        const mobileNumber = req.user.MobileNumber;
        const user = await prisma.user.findFirst({
            where:{
                MobileNumber: mobileNumber
            }
        })
        
        if(!user){
            return res.status(400).json(responseObj(false,null,"User not found"));
        }
        const parsedBody = bookRideSchema.safeParse(req.body);

        if(!parsedBody.success){
            res.status(411).json(responseObj(false,"Incorrect Input",parsedBody.error as any));
        }
        const  booking = await prisma.bookings.create({
            data:{
                UserId: Number(user.Id),
                Status: "Pending",
                Product: parsedBody.data?.Product as string,
                DropLocation: parsedBody.data?.DropLocation as string,
                PickUpLocation: parsedBody.data?.PickUpLocation as string,
                VehicleType: parsedBody.data?.VehicleType as VehicleType,
                DropLangitude: parseFloat(parsedBody.data?.DropLongitude as string),
                DropLatitude: parseFloat(parsedBody.data?.DropLatitude as string),
                PickUpLatitude: parseFloat(parsedBody.data?.PickupLatitude as string),
                PickUpLongitude: parseFloat(parsedBody.data?.PickupLongitude as string),
                Distance: parsedBody.data?.Distance as string,
                Fare: parsedBody.data?.Fare as string,
                PaymentMode: parsedBody.data?.PaymentMode as any,
                StartTime: parsedBody.data?.StartTime as string,             
            }
        })

        let rideRequest: RideRequest;
        rideRequest={
            Name: user.Name,
            pickupLat: booking.PickUpLatitude,
            pickupLng: booking.PickUpLongitude,
            Distance: booking.Distance,
            Fare: booking.Fare,
            PickUpLocation: booking.PickUpLocation,
            DropLocation: booking.DropLocation,
            DropLng: booking.DropLangitude,
            DropLat: booking.DropLatitude,
            Product: booking.Product,
            StartTime: booking.StartTime.toUTCString as unknown as string,
            PaymentModde: booking.PaymentMode
        }
        notifyNearbyDrivers(rideRequest)
        res.status(200).json(responseObj(true,booking,"Booking Successfully Created"));

    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}           
export const getUserBookingHistory = async (req:Request, res:Response): Promise<any>=>{

    try{
        //@ts-ignore
        const mobileNumber = req.user.MobileNumber;
        const user = await prisma.user.findFirst({ 
            where:{
                MobileNumber: mobileNumber
            }
        })

        if(!user){
            return res.status(400).json(responseObj(false,null,"User not found"));
        }
        
        
        const bookings = await prisma.bookings.findMany({
            where:{
                UserId: Number(user.Id),
                Status: "Completed"
            },
           
            include:{
                Driver:{
                    select:{
                        Name:true
    
                    }
                },
                Vehicle:{
                  select:{
                    Model: true
                  }
                }
            },
        });

        res.status(200).json(responseObj(true,bookings,"Bookings Successfully Fetched"));

    }
    catch(err: any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
    


}

export const getNegotiatedFares = async (req:Request, res:Response): Promise<any> =>{
    try{
        //@ts-ignore
        const bookingId = req.query.bookingId;
        const mobileNumber = req.user.MobileNumber;
        const user = await prisma.user.findFirst({
            where:{
                MobileNumber: mobileNumber
            }
        })  

        if(!user){
            return res.status(400).json(responseObj(false,null,"User not found"));
        }   

        const negotiatedFares = await prisma.fareNegotiation.findMany({
            where:{
               BookingId: Number(bookingId)
            },  
            include:{
                Driver:true,                
                Booking:true

            }
        })

        res.status(200).json(responseObj(true,negotiatedFares,"Negotiated Fares Fetched Successfully"));
        
        
    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

export const acceptNegotiatedFare = async (req:Request, res:Response): Promise<any> =>{
    try{
        //@ts-ignore
        const mobileNumber = req.user.MobileNumber;
        const user = await prisma.user.findFirst({
            where:{
                MobileNumber: mobileNumber
            }
        })  

        if(!user){
            return res.status(400).json(responseObj(false,null,"User not found"));
        }   

        const parsedBody = acceptNegotiatedFareSchema.safeParse(req.body);
        if(!parsedBody.success){
            return res.status(400).json(responseObj(false,null,"Invalid Input"));
        }
        
        
    }
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
}

export const getCustomerDetails = async (req:Request, res: Response): Promise<any>=>{

    const customerId = req.user.Id;

    try{

        const customerDetails = await prisma.user.findFirst({
            where:{
                Id: customerId 
            },
            select:{
                Name:true,
                MobileNumber:true,
                DOB:true,
                Gender:true
            }
        });

        res.status(200).json(responseObj(true,customerDetails,"Successfully fetched"));
    }

    catch(error:any){
        res.status(500).json(responseObj(false,null,"error:"+error));
    }

}

export const getFare = async (req:Request, res:Response) : Promise<any> =>{
    
   const fare= await prisma.fare.findMany({});

   return res.status(200).json(responseObj(true,fare,"Successfully fetched"));
}
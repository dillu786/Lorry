import express from "express"
import type { Request,Response } from "express";
import { getObjectSignedUrl } from "../../../utils/s3utils";
import { PaymentMode, Prisma, PrismaClient, VehicleType } from "@prisma/client"
import { responseObj } from "../../../utils/response";
import { acceptNegotiatedFareSchema, bookRideSchema } from "../../../types/Customer/types";
import { notifyNearbyDrivers } from "../../..";
import type { RideRequest } from "../../../types/Common/types";
import { declineBookingSchema } from "../../../types/Customer/types";
import { GetObjectAclCommand } from "@aws-sdk/client-s3";
const prisma = new PrismaClient();

export const declineBooking = async (req: Request, res: Response): Promise<any>=>{
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
                console.log(`booking, driver ${JSON.stringify(booking)}`)
                if(!booking){
                    return res.status(400).json(responseObj(false,null,"Booking not found"));
                }
                if(!driver){
                    return res.status(400).json(responseObj(false,null,"Driver not found"));
                }
        const fareNegotiation = await prisma.fareNegotiation.findFirst({
            where:{
                BookingId: parsedBody.data.BookingId,
                DriverId: parsedBody.data.DriverId
            }
        })

        if(!fareNegotiation){
            return res.status(400).json(responseObj(false,null,"negotiation does not exist"));
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
        const booking = await prisma.bookings.findFirst({
            where:{
                Id: Number(bookingId)
            }
        })
        if(!booking){   
            return res.status(400).json(responseObj(false,null,"Booking not found"));
        }
        await prisma.bookings.update({
            where:{
                Id: Number(bookingId),
             
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
        const page = Number(req.query.page) || 1
        const limit = Number(req.query.page) || 5
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
                Status:  { 
                     in:["Confirmed","Pending"]                 
                },
                
            },
        
            include:{
                Driver:{
                    select:{
                        Name: true,
                        MobileNumber: true
                    }
                },
                Vehicle:{
                  select:{
                    Model: true,
                    VehicleImage: true
                  }
                }
            },
            take: Number(limit),
            skip: Number((page -1) * limit),

            orderBy:{
                CreatedDateTime :"desc"
            }
        });
       
        const resp = await Promise.all(bookings.map( async item=>{

            if(item.Vehicle?.VehicleImage){
             item.Vehicle.VehicleImage =  await getObjectSignedUrl(item.Vehicle.VehicleImage);
            }
            return item
        }))
       
        res.status(200).json(responseObj(true, resp ,"Bookings Successfully Fetched"));
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

        const page = Number(req.query.page) || 1 ;
        const limit = Number(req.query.limit) || 5 ;
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
            orderBy:{
                CreatedDateTime:"desc"
            },
            take: limit,
            skip: (page-1) * limit
        });

        res.status(200).json(responseObj(true,bookings,"Bookings Successfully Fetched"));

    }
    catch(err: any){
        res.status(500).json(responseObj(false,null,"Something went wrong"));
    }
    


}

export const getNegotiatedFares = async (req: Request, res: Response): Promise<any> => {
    try {
      //@ts-ignore
      const bookingId = req.query.bookingId;
      //@ts-ignore
      const mobileNumber = req.user?.MobileNumber;
  
      const user = await prisma.user.findFirst({
        where: {
          MobileNumber: mobileNumber
        }
      });
  
      if (!user) {
        return res.status(400).json(responseObj(false, null, "User not found"));
      }
  
      const negotiatedFares = await prisma.fareNegotiation.findMany({
        where: {
          BookingId: Number(bookingId),
          Status: "Pending"
        },        
        include: {
          Driver: {
            select: {
              Id: true,
              Name: true,
              DriverImage: true,
              DriverVehicles: {
                select: {
                  VehicleId: true
                }
              }
            }
          },
          Booking: true
        }
      });
  
      // Use Promise.all to resolve async operations inside .map
      const result = await Promise.all(
        negotiatedFares.map(async fare => {
          const vehicleId = fare.Driver?.DriverVehicles?.[0]?.VehicleId || null;
          const signedUrl = fare.Driver?.DriverImage
            ? await getObjectSignedUrl(fare.Driver.DriverImage)
            : null;
  
          return {
            ...fare,
            Driver: {
              Id: fare.Driver?.Id,
              VehicleId: vehicleId,
              DriverImage: signedUrl,
              Name: fare.Driver.Name
            }
          };
        })
      );
  
      return res.status(200).json(responseObj(true, result, "Negotiated Fares Fetched Successfully"));
    } catch (error: any) {
      console.error("Error in getNegotiatedFares:", error);
      return res.status(500).json(responseObj(false, null, "Something went wrong: " + error.message));
    }
  };
  

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
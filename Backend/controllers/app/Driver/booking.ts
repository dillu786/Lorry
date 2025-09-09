import type { Request,Response } from "express"
import { PrismaClient, type Bookings } from "@prisma/client"
import { responseObj } from "../../../utils/response";
import { acceptRideSchema, makeDriverOnlineSchema } from "../../../types/Driver/types";
import { negotiateFareSchema } from "../../../types/Driver/types";
import { getObjectSignedUrl, uploadFile,generateFileName } from "../../../utils/s3utils";
import { haversineDistance } from "../../../utils/haversine";
import { notifyNegotiatedFare } from "../../..";
const prisma = new PrismaClient();

export const newBookings = async (req: Request, res: Response): Promise<any> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, parseInt(req.query.limit as string) || 10);
  
      const driverLatitude = parseFloat(req.query.driverLatitude as string);
      const driverLongitude = parseFloat(req.query.driverLongitude as string);
  
      if (isNaN(driverLatitude) || isNaN(driverLongitude)) {
        return res.status(400).json(responseObj(false, null, "Send valid driver latitude and longitude"));
      }
  
      // Fetch all pending bookings without fare negotiations
      const allBookings = await prisma.bookings.findMany({
        where: {
          Status: 'Pending',
          FareNegotiations: {
            none: {} // Booking must not have any fare negotiation
          }
        },
        include:{
            User:{
                select:{
                    Name:true,
                    MobileNumber:true
                }
            }
        },
        orderBy: { CreatedDateTime: 'desc' }
      });

      // Filter bookings within 20km radius
      const filteredBookings = allBookings.filter((booking) => {
        const distance = haversineDistance(
          driverLatitude,
          driverLongitude,
          booking.PickUpLatitude,
          booking.PickUpLongitude
        );
        return distance <= 20;
      });

      // Apply pagination to filtered results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedBookings = filteredBookings.slice(startIndex, endIndex);
      
      const totalCount = filteredBookings.length;
      const totalPages = Math.ceil(totalCount / limit);
      
      return res.status(200).json(responseObj(true, {
        bookings: paginatedBookings,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }, "Successfully fetched"));
    } catch (error) {
      console.error("Error in newBookings:", error);
      return res.status(500).json(responseObj(false, null, "Something went wrong"));
    }
  };


      export const getDriverBookingHistory = async (req:Request, res:Response): Promise<any>=>{

    try{
        //@ts-ignore

        const page = Number(req.query.page) || 1 ;
        const limit = Number(req.query.limit) || 5 ;
        const driverId = req.user.Id;

        const bookings = await prisma.bookings.findMany({
            where:{
                DriverId: driverId,
                Status: "Completed"
            },
           
            include:{
                Driver:{
                    select:{
                        Name:true  
                    }
                },
                User:{
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

export const acceptedBookings = async (req: Request,res: Response): Promise<any> =>{
    try{
        
        const driverId = req.user.Id;
        if( driverId == null || driverId == undefined){
            res.status(411).json(responseObj(false,null,"Incorrect Input"));
        }
        const acceptedBookings = await prisma.bookings.findMany({
            where:{
                Status:"Confirmed",
                DriverId: driverId  
            },
            include:{
                User:{
                    select:{
                        Name:true,
                        MobileNumber:true
                    }
                    
                },
                Driver:{
                    select:{
                        Name:true,
                        MobileNumber:true
                    }
                }
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
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        //@ts-ignore
        const driverId = req.user.Id as string;
    
        if(driverId == ""|| driverId == null || driverId == undefined){
            res.status(411).json(responseObj(false,null,"Incorrect Input"));
        }
    
        const completedRides = await prisma.bookings.findMany({
           where:{
            DriverId : parseInt(driverId),
            Status : "Completed"
           },
           take: limit,
           skip: (page -1)* limit,
           orderBy:{
           CreatedDateTime : "desc"
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
            },
            include:{
                User:{
                    select:{
                        Name : true,
                        MobileNumber : true
                    }
                }
            },
            orderBy:{
                CreatedDateTime:"desc"
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
            const driverId = req.user.Id;
             const TripOngoing = await prisma.bookings.findFirst({
                where:{

                    DriverId: driverId,
                    Status: "Ongoing"
                }
             })

             if(TripOngoing){
                return res.status(411).json(responseObj(false,null,"One Trip already ongoing"));
             }
            const bookingId = req.query.bookingId as string;

            const booking = await prisma.bookings.findFirst({
                where:{
                    Id: Number(bookingId)
                }
            });

            if(!booking){
                return res.status(411).json({
                    message:"Incorrect input"
                });
            }

            //@ts-ignore
            if(!req.files || !req.files['productPhoto']){
                return res.status(411).json(responseObj(false,"","Product photo is required"))

            }
            //@ts-ignore
            const productImage = req.files['productPhoto'][0];
            const productImageName = generateFileName();
            await uploadFile(productImage.buffer,productImageName,productImage.mimetype);

        
            if(bookingId == ""|| bookingId == null || bookingId == undefined){
                return res.status(411).json(responseObj(false,null,"Incorrect Input"));
            }
            
            console.log("before update product image"+productImageName);
            await prisma.bookings.update({
                where:{
                    Id: parseInt(bookingId)
                },
                data:{
                    Status:"Ongoing",
                    ProductImage: productImageName
                }
            })
            console.log("after update")
            res.status(200).json(responseObj(true,null,""));
            
        }
        catch(error:any){
            res.status(500).json(responseObj(false,null,"Something went wrong"+JSON.stringify(error)));
        }
    }


export const endTrip = async (req:Request, res:Response): Promise<any> =>{
    try{
        const bookingId = req.query.bookingId;
        const booking = await prisma.bookings.findFirst({
            where:{
                Id: Number(bookingId),
                Status: "Ongoing"
            }
        });

        if(!booking){
            return res.status(400).json({
                message : "Booking does not exist"
            })
        }

        await prisma.bookings.update({
            where:{
                Id: Number(bookingId)

            },
            data:{
                Status:"Completed"
            }
        });
       
        res.status(200).json(responseObj(true,"","successfully updated"));
    }
    catch(error:any){

        res.status(500).json(responseObj(false,null,"something went wrong"+error))
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
        if(await prisma.fareNegotiation.findFirst({
            where:{
                BookingId: parsedBody.data?.BookingId as number,
                DriverId: parseInt((parsedBody.data?.DriverId as unknown as string))
            }
        })){
        await prisma.fareNegotiation.update({
            where:{
                BookingId_DriverId: {
                    BookingId: parsedBody.data?.BookingId as number,
                    DriverId: parseInt((parsedBody.data?.DriverId as unknown as string))
                }
            },
            data:{
                DriverId: parseInt((parsedBody.data?.DriverId as unknown as string)),
                Status: "Accepted"
            }
        })
    
      
    }
    res.status(200).json(responseObj(true,acceptedBooking,""));
}

    catch(error: any){
        res.status(500).json(responseObj(false,null,"Something went wrong"+error));
    }
}

export const getDriverDetails = async (req: Request, res: Response): Promise<any> => {
    try {
        const driverId = Number(req.user.Id);

        const driver = await prisma.driver.findFirst({
            where: { Id: driverId },
            select: {
                Name: true,
                MobileNumber: true,
                Id: true,
                DOB: true,
                DrivingLicenceNumber: true,
                DriverImage: true,
                DrivingLicenceBackImage: true,
                DrivingLicenceFrontImage: true,
                DriverOwner: {
                    select: {
                        OwnerId: true,
                        Owner:{
                            select: {
                                Name: true
                            }
                        }
                    }
                },
                DriverVehicles: {
                    select: {
                        VehicleId: true,
                        Vehicle: {
                            select: {
                                Model: true,
                                VehicleImage: true,
                                VehicleNumber: true,
                                VehicleType: true
                            }
                        }
                    }
                }
            },
        });

        if (!driver) {
            return res.status(400).json(responseObj(false, null, "Driver not found"));
        }

        // Signed URLs
        driver.DriverImage = await getObjectSignedUrl(driver.DriverImage as string);
        driver.DrivingLicenceFrontImage = await getObjectSignedUrl(driver.DrivingLicenceFrontImage as string);
        driver.DrivingLicenceBackImage = await getObjectSignedUrl(driver.DrivingLicenceBackImage as string);

        for (const vehicle of driver.DriverVehicles) {
            vehicle.Vehicle.VehicleImage = await getObjectSignedUrl(vehicle.Vehicle.VehicleImage as string);
        }

        return res.status(200).json(responseObj(true, driver, "Successfully fetched"));

    } catch (error: any) {
        return res.status(500).json(responseObj(false, null, error.message || "Server error"));
    }
};

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
        notifyNegotiatedFare();
        res.status(200).json(responseObj(true,null,""));
    }   
    catch(error:any){
        res.status(500).json(responseObj(false,null,"Something went wrong"+error));
    }
}


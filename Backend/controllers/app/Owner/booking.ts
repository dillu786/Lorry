import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { responseObj } from '../../../utils/response';

// Extend Request type to include user property with Id
declare global {
    namespace Express {
        interface Request {
            user: {
                Id: number;
                [key: string]: any;
            }
        }
    }
}

const prisma = new PrismaClient();
export const getLiveBooking = async (req:Request, res:Response): Promise<any>=>{
    try{
       const ownerId = req.user.Id;
       const allDrivers = await prisma.owner.findMany({
        where:{
            Id: ownerId
        }
       });

       const liveBookings = await prisma.bookings.findMany({
        where:{
            DriverId: {in: allDrivers.map(driver => driver.Id)},
            Status: "Ongoing"
        }
       })
       return responseObj(true,liveBookings as any,"Live Bookings Fetched Successfully" as string);
    }
    catch(error:any){
        return responseObj(false,null,error.message as string);
    }
}

export const getCompletedBooking = async (req:Request, res:Response): Promise<any>=>{
    try{
        const ownerId = req.user.Id;
        const allDrivers = await prisma.owner.findMany({
            where:{
                Id: ownerId
            }
        });
        const completedBookings = await prisma.bookings.findMany({
            where:{
                DriverId: {in: allDrivers.map(driver => driver.Id)},
                Status: "Completed"
            }
        })
        return responseObj(true,completedBookings as any,"Completed Bookings Fetched Successfully" as string);  
    }
    catch(error:any){
        return responseObj(false,null,error.message as string);
    }
}
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

export const getCurrentBooking = async (req: Request, res: Response): Promise<any> => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const ownerId = req.user.Id;
        const allDrivers = await prisma.ownerDriver.findMany({
            where: {
                OwnerId: ownerId
            }
        });
        if (allDrivers.length === 0) {
            return res.status(400).json(responseObj(false, null, "No drivers linked to owner")
            )
        }
        console.log(`all drivers ${JSON.stringify(allDrivers)}`)

        const liveBookings = await prisma.bookings.findMany({
            where: {
                DriverId: { in: allDrivers.map(driver => driver.Id) },
                Status: {
                    in: ["Pending", "Pending"]
                }
            },
            orderBy: {
                CreatedDateTime: "desc"
            },
            take: limit,
            skip: (page - 1) * limit

        })
        return responseObj(true, liveBookings as any, "Live Bookings Fetched Successfully" as string);
    }
    catch (error: any) {
        return responseObj(false, null, error.message as string);
    }
}

export const getLiveBooking = async (req: Request, res: Response): Promise<any> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5;
        const ownerId = req.user.Id;
        const allDrivers = await prisma.ownerDriver.findMany({
            where: {
                OwnerId: ownerId
            }
        });
        if (allDrivers.length === 0) {
            return res.status(400).json(responseObj(false, null, "No drivers linked to owner")
            )
        }
        const liveBookings = await prisma.bookings.findMany({
            where: {
                DriverId: { in: allDrivers.map(driver => driver.DriverId) },
                Status: "Ongoing"
            },
            orderBy: {
                CreatedDateTime: "desc"
            },
            take: limit,
            skip: (page - 1) * limit

        })
        return res.status(200.).json(responseObj(true, liveBookings as any, "Live Bookings Fetched Successfully" as string));
    }
    catch (error: any) {
        return res.status(500).json(responseObj(false, null, error.message as string));
    }
}

export const getCompletedBooking = async (req: Request, res: Response): Promise<any> => {
    try {

        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 5
        const ownerId = req.user.Id;
        const allDrivers = await prisma.ownerDriver.findMany({
            where: {
                OwnerId: ownerId
            }
        })
        if (allDrivers.length === 0) {
            return res.status(400).json(responseObj(false, null, "No drivers linked to owner")
            )
        }


        const completedBookings = await prisma.bookings.findMany({
            where: {
                DriverId: { in: allDrivers.map(driver => driver.DriverId) },
                Status: "Completed"
            },
            include:{
                Driver:{
                    select:{
                        Name: true,
                        MobileNumber: true
                    }
                },
                User:{
                    select:{
                        Name: true,
                        MobileNumber: true
                    }
                }
            },
            orderBy: {
                CreatedDateTime: "desc"
            },
            take: limit,
            skip: (page - 1) * limit
        })
        return res.status(200).json(responseObj(true, completedBookings as any, "Completed Bookings Fetched Successfully" as string));
    }
    catch (error: any) {
        return res.status(500).json(responseObj(false, null, error.message as string));
    }
}
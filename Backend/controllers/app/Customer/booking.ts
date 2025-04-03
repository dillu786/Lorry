import express from "express"
import type { Request,Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client"
import { responseObj } from "../../../utils/response";
const prisma = new PrismaClient();

export const getBookingHistoryByuserId = async (req:Request, res:Response): Promise<any>=>{

    try{
        const userId = req.params.userId;
        if (userId ===null || userId === undefined || userId === "")
            return res.status(411).json(responseObj(false,null,"Incorrect Input"));

        const bookings = await prisma.bookings.findMany({
            where:{
                UserId: Number(userId),
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
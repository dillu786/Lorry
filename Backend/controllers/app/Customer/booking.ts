import express from "express"
import type { Request,Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client"
import { responseObj } from "../../../utils/response";
const prisma = new PrismaClient();


export const bookRide = async (req:Request, res:Response): Promise<any>=>{
    try{

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
import express from "express"
import type { Request,Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client"
import { responseObj } from "../../../utils/response";
import { acceptNegotiatedFareSchema, bookRideSchema } from "../../../types/Customer/types";
const prisma = new PrismaClient();


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
        
        const  booking = await prisma.bookings.create({
            data:{
                UserId: Number(user.Id),
                Status: "Pending"
            }
        })

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
               Booking:{
                UserId: Number(user.Id)
               }
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
import type { NextFunction,Request,Response } from "express";
import jwt from "jsonwebtoken"
import express from "express";
const app = express();
app.use(express.json());
export const Drivermiddleware = async (req:Request,res:Response, next:NextFunction):Promise<any>=>{
    try{
        
        let token = req.header("Authorization");
        console.log("token"+token);
        if(token){
           
            jwt.verify(token,process.env.JWT_SECRET_DRIVER as unknown as string,(err:any,res:any)=>{
                if(err){
                    return res.status(401).josn({
                        message: "Invalid Token"
                    });
                }
                //@ts-ignore
                req.user=res
            });
            next()
        }
        else{
            return res.status(401).json({
                message: "Token not found"
            });
        }
    }

    catch(error:any){
        res.status(400).json({
            message : "Token not found"
        })
    }
}

export const CustomerMiddleware = async (req:Request,res:Response, next:NextFunction):Promise<any>=>{
    try{
        
        let token = req.header("Authorization");
        console.log("token"+token);
        if(token){
           
            jwt.verify(token,process.env.JWT_SECRET_CUSTOMER as unknown as string,(err:any,res:any)=>{
                if(err){
                    return res.status(401).josn({
                        message: "Invalid Token"
                    });
                }
                //@ts-ignore
                req.user=res
            });
            next()
        }
        else{
            return res.status(401).json({
                message: "Token not found"
            });
        }
    }

    catch(error:any){
        res.status(400).json({
            message : "Token not found"
        })
    }
}

export const OwnerMiddleware = async (req:Request,res:Response, next:NextFunction):Promise<any>=>{
    try{
        
        let token = req.header("Authorization");
        console.log("token"+token);
        console.log(req.body);
        if(token){
           
            jwt.verify(token,process.env.JWT_SECRET_OWNER as unknown as string,(err:any,res:any)=>{
                if(err){
                    return res.status(401).josn({
                        message: "Invalid Token"
                    });
                }
                //@ts-ignore
                req.user=res
            });
            next()
        }
        else{
            return res.status(401).json({
                message: "Token not found"
            });
        }
    }

    catch(error:any){
        res.status(400).json({
            message : "Token not found"
        })
    }
}


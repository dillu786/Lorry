import type { NextFunction,Request,Response } from "express";
import jwt from "jsonwebtoken"

export const middleware = async (req:Request,res:Response, next:NextFunction)=>{

    let token = req.header("Authorization");
    if(token){
        token = token.replace("Bearer","");
        jwt.verify(token,process.env.JWT_SECRET as unknown as string,(err:any,res:any)=>{
            if(err){
                return res.status(401).josn({
                    message: "Invalid Token"
                });
            }
            //@ts-ignore
            req.user=res.user
        });
        next()
    }

    res.status(400).json({
        message : "Token not found"
    })

}
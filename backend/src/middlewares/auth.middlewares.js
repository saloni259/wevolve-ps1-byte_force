import jwt from "jsonwebtoken"
import { Candidate } from "../models/candidate.models.js"
import { apiError } from "../utils/apiError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import dotenv from "dotenv"
dotenv.config({path:"./.env"})



const verifyJWT = asyncHandler(async(req,res,next) => {
    try {
         const token = req?.cookies.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token){
            throw new apiError(401,"wrong..");
        }
        const decodeToken =   jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
        if(!decodeToken){
            throw new apiError(500,"something went wrong")
        }
        const user = await Candidate.findById(decodeToken?._id).select("-password -refreshToken")
        if(!user){
            throw new apiError(401,"wrong......")
        }
        req.user = user
        next();
    } catch (error) {
        throw new apiError(400,error?.message||"token is wrong")
    }
})

export {verifyJWT}
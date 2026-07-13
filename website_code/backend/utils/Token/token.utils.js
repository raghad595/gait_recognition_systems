import jwt from "jsonwebtoken"
import { roles } from "../../db/models/user.model.js";
import { nanoid } from "nanoid";

export const signatureEnum = {
    admin:"Admin",
    user:"User"
};

export const logoutEnum = {
    allDevices:"allDevices",
    logout  :"logout",
    stayloggedIn:"stayloggedIn"
};

export const signToken = ({payload = {} , signature , options = {expiresIn :process.env.ACCESS_TOKEN_EXPIRES_IN}})=>{
    return jwt.sign(payload,signature,options)
}

export const verifyToken = ({token = "" , signature})=>{
    return jwt.verify(token,signature)
} 

export const getSignature = async({ signatureLevel = signatureEnum.user }) => {
    
    let signature = {accessSignature:undefined,refreshSignature:undefined}

    // Use the same signature keys for both admin and user
    signature.accessSignature = process.env.ACCESS_TOKEN_SIGNATURE;
    signature.refreshSignature = process.env.REFRESH_TOKEN_SIGNATURE;

    if (!signature.accessSignature || !signature.refreshSignature) {
        throw new Error("Token signatures are not configured in environment variables");
    }

    return signature;
};

export const getNewLoginCredentials = async (user) =>{
    let signature = await getSignature({
        signatureLevel: user.role != roles.user ? signatureEnum.admin : signatureEnum.user
    });

    const jwtid = nanoid()

    const accessToken = signToken({
        payload:{_id:user._id, role:user.role} ,
        signature:signature.accessSignature,
        options:{
            expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
            issuer:"Gait Recognition Backend",
            subject:"Authentcation",
            jwtid
        }
    })
    const refreshToken =  signToken({
        payload:{_id:user._id, role:user.role} ,
        signature:signature.refreshSignature,
        options:{
        issuer:"Gait Recognition Backend",
        subject:"Authentcation",
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
        jwtid
    }})
    return {accessToken,refreshToken}
};

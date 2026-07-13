import { UserModel } from "../db/models/user.model.js";
import { getSignature, verifyToken } from "../utils/Token/token.utils.js";
import * as dbService from "../db/dbService.js"
import TokenModel from "../db/models/token.model.js";

export const tokenTypeEnum = {
    access:"access",
    refresh:"refresh"
}

const decodedToken = async({authorization,tokenType = tokenTypeEnum.access,next})=>{
    if (!authorization || typeof authorization !== "string") {
        return next(new Error("Missing Authorization header", { cause: 401 }));
    }

    const [bearer , token] = authorization.split(" ") || [];

    if(!bearer || !token){
        return next(new Error("Invalid Token",{cause:400}))
    }

    let signature = await getSignature({
        signatureLevel:bearer
    })

    const decoded = verifyToken({
        token,
        signature:tokenType === tokenTypeEnum.access 
        ? signature.accessSignature
        : signature.refreshSignature,
    });

    if(decoded.jti &&
        (await dbService.findOne({
        model:TokenModel,
        filter:{
            jti: decoded.jti,  
        }
    }) )){
        return next (new Error("Token Revoked" , {cause:401}))
    }

    const user = await dbService.findById({
        model: UserModel,
        id: { _id: decoded._id },
    });
    if(!user) return next(new Error("User Not Found" , {cause:404}));

    if(user.changeCredentialsTime?.getTime() > decoded.iat * 1000){
        return next (new Error("Credentials Changed, Please Login Again" , {cause:401}))
    }
    return { user , decoded};
};

export const authentication = ({tokenType=tokenTypeEnum.access}={})=>{
    return async(req , res ,next)=>{
        try {
            const tokenData = await decodedToken({
                authorization: req.headers.authorization,
                tokenType,
                next,
            });

            if (!tokenData) return;

            req.user = tokenData.user;
            req.decoded = tokenData.decoded;
            return next();
        } catch (error) {
            return next(error);
        }
    }
};

export const authorization =({accessRoles=[] }={})=>{
    return async(req,res,next)=>{
        if(!accessRoles.includes(req.user.role))
            return next(new Error("You Don't Have Access To This Route" , {cause:403}))
        return next()
    }
};

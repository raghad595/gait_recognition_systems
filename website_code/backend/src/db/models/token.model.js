import mongoose, { Schema } from "mongoose";

export const tokenSchema =new Schema({
    jti:{
        type: String,
        required:true,
        unique:true
    },
    expireIn:{
        type:Number,
        required:true
    },
    expiresAt: {
        type: Date,
        required: true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    }
},
    {timestamps:true}
); 
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
const TokenModel = mongoose.models.Token || mongoose.model("Token", tokenSchema);
export default TokenModel;

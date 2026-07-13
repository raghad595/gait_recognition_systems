import mongoose, { Schema } from "mongoose";

export const genderEnum = {
    male:"male",
    female:"female" 
};
export const providers = {
    system:"SYSTEM",
    google:"GOOGLE" ,
};
export const roles = {
    user:"USER",
    admin:"ADMIN" ,
    researcher:"RESEARCHER",
    securityOfficer:"SECURITY_OFFICER"
};
export const userSchema =new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,
        minLength: [3, "Full name must be at least 3 characters"],
        maxLength: [40, "Full name must be at most 40 characters"]
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    password:{
        type: String,
        required: function(){
            return this.provider === providers.system ? true : false;
        }
    },
    gender:{
        type: String,
        enum:{
            values : Object.values(genderEnum),
            message:"Gender must be male or female"
        }
    },
    phone:{
        type: String
    },
    institution: {
        type: String,
        trim: true,
        default: ""
    },
    
    confirmEmailOtp: String,

    forgetPasswordOtp: String,

    otpExpiredAt:{ type: Date , default: Date.now() },

    fieldAttempts: { type: Number, default: 0 },

    lockUntil: { type: Date , default: null },

    confirmEmail: { type: Boolean, default: false },

    changeCredentialsTime: {type: Date}, 

    profileImage: String,

    coverImages: [String],

    profileCloudImage:{public_id:String , secure_url:String},

    coverCloudImages:[{public_id:String , secure_url:String}],


    provider:{
        type:String,
        enum:Object.values(providers),
        message:"Provider must be either System or Google",
        default: providers.system
    },
    role:{
        type:String,
        enum:{
            values:Object.values(roles),
            message:"Role must be either user or admin",
        },
        default:roles.user,  
    },
    freezedAt: { type: Date, default: null },
    freezedBy:{type:mongoose.Schema.Types.ObjectId , ref:"User"},

    restoredAt: { type: Date, default: null },
    restoredBy:{type:mongoose.Schema.Types.ObjectId , ref:"User"},

    gaitProfiles:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "GaitProfile"
    }],

    analysisHistory:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "GaitAnalysis"
    }]

},
    {timestamps:true , toJSON:{virtuals:true} , toObject:{virtuals:true}}
); 
export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
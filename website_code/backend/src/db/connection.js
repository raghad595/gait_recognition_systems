import mongoose from "mongoose";

export const connectDB = async () =>{
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
        throw new Error("MONGODB_URI is not set. Add it to new_3omda/.env before starting the backend.");
    }

    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
        });
        console.log("DB connected successfully");
    } catch (error) {
        throw new Error(`DB connection Error: ${error.message}`);
    }
}  

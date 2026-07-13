import mongoose, { Schema } from "mongoose";

export const settingSchema = new Schema({
    similarityThreshold: {
        type: Number,
        required: true,
        min: 0,
        max: 1,
        default: 0.75
    },
    frameSamplingRate: {
        type: Number,
        required: true,
        min: 1,
        default: 30
    },
    name: {
        type: String,
        default: "default_model_config",
        unique: true
    }
}, { timestamps: true });

export const SettingModel = mongoose.models.Setting || mongoose.model("Setting", settingSchema);

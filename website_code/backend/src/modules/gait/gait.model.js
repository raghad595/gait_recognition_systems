import mongoose, { Schema } from "mongoose";

export const gaitProfileSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    video_url: {
        type: String
    },
    video_public_id: {
        type: String
    },
    video_duration: {
        type: Number,
        description: "Duration in seconds"
    },
    file_size: {
        type: Number,
        description: "File size in bytes"
    },
    file_name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        trim: true
    },
    condition: {
        type: String,
        enum: ["normal", "bag", "coat"],
        default: "normal"
    },
    status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending"
    },
    upload_date: {
        type: Date,
        default: Date.now
    },
    last_analyzed_at: {
        type: Date
    },
    metadata: {
        height: Number,
        width: Number,
        frame_rate: Number,
        codec: String,
        duration: Number
    },
    person_name: {
        type: String,
        trim: true
    },
    feature_vector: {
        type: [Number],  // Mean feature vector from AI model (1D array)
        default: undefined
    },
    feature_dimensions: {
        type: Number
    },
    vector_status: {
        type: String,
        enum: ["pending", "processing", "completed", "failed"],
        default: "pending"
    }
}, { timestamps: true });

// Performance indexes
gaitProfileSchema.index({ condition: 1 });
gaitProfileSchema.index({ user_id: 1 });

export const GaitProfileModel = mongoose.models.GaitProfile || mongoose.model("GaitProfile", gaitProfileSchema);

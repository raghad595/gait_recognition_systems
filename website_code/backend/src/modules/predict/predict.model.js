import mongoose, { Schema } from "mongoose";

/**
 * PredictResult — stores results from the /api/predict endpoint.
 *
 * This is separate from GaitAnalysisModel which requires a gait profile.
 * This model is lightweight and allows saving results for anonymous or
 * direct-upload flows without needing a pre-created profile.
 */
const predictResultSchema = new Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        // ── Input metadata ──────────────────────────────────────────────────
        file_name: {
            type: String,
            required: true,
        },
        file_type: {
            type: String, // "image" | "video"
            enum: ["image", "video"],
            required: true,
        },
        file_size_bytes: Number,

        // ── HF Model Output ─────────────────────────────────────────────────
        is_video: {
            type: Boolean,
            default: false,
        },
        frame_count: Number, // only for video
        feature_dimensions: {
            type: Number,
            required: true,
        },
        mean_feature_vector: {
            type: [Number], // 1D array — already computed mean across frames
            required: true,
        },
        hf_message: String, // optional message from HF (e.g. "Processed 300 frames")
        hf_endpoint: String, // which endpoint was called

        // ── Status ──────────────────────────────────────────────────────────
        status: {
            type: String,
            enum: ["completed", "failed"],
            default: "completed",
        },
        processing_time_ms: Number,

        // ── Optional notes ───────────────────────────────────────────────────
        label: String,    // user can optionally label the recording
        notes: String,
    },
    { timestamps: true }
);

// Indexes for dashboard queries
predictResultSchema.index({ createdAt: -1 });
predictResultSchema.index({ user_id: 1, createdAt: -1 });
predictResultSchema.index({ file_type: 1 });

export const PredictResultModel =
    mongoose.models.PredictResult ||
    mongoose.model("PredictResult", predictResultSchema);

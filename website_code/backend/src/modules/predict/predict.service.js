import axios from "axios";
import { GaitProfileModel } from "../gait/gait.model.js";
import { GaitAnalysisModel } from "../analysis/analysis.model.js";
import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || "dummy",
});

const EXTERNAL_PREDICT_API_URL = process.env.EXTERNAL_PREDICT_API_URL || "https://mohamed6262-gait-1.hf.space/predict";
const REQUEST_TIMEOUT = Number(process.env.PREDICT_TIMEOUT_MS || 180000); // 3 min for video

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const buildMultipartPayload = (req) => {
    const formData = new FormData();
    const files = Array.isArray(req.files) ? req.files : [];

    Object.entries(req.body || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    });

    files.forEach((file) => {
        const blob = new Blob([file.buffer], { type: file.mimetype });
        // HF Space expects the field name to be exactly 'file'
        formData.append("file", blob, file.originalname);
    });

    return formData;
};

const buildJsonPayload = (req) => req.body || {};

const extractAxiosError = (error) => {
    if (error.response) {
        return {
            statusCode: error.response.status,
            message:
                error.response.data?.message ||
                error.response.data?.error ||
                "External prediction API returned an error",
            details: error.response.data,
        };
    }

    if (error.code === "ECONNABORTED" || error.code === "ERR_CANCELED") {
        return {
            statusCode: 504,
            message: "Prediction request timed out — the video may be too long.",
            details: null,
        };
    }

    return {
        statusCode: 502,
        message: error.message || "Unable to reach external prediction API",
        details: null,
    };
};

// ─────────────────────────────────────────────────────────────────────────────
// KEY FIX: Compute the mean feature vector across all frames for videos.
//
// The HF Space returns a 2D array: [ [3840 floats per frame] × N frames ]
// For a 5-second video at 30fps = 150 frames → 150 × 3840 = 576,000 floats.
// Sending this raw to the browser causes a JS heap crash / black screen.
//
// Solution: average all frame vectors into ONE 1D representative vector.
// This preserves the gait signature while keeping the response tiny (~30KB).
// ─────────────────────────────────────────────────────────────────────────────
const computeMeanVector = (featureMatrix) => {
    if (!Array.isArray(featureMatrix) || featureMatrix.length === 0) return [];

    // Already a 1D vector (image case) — return as-is
    if (!Array.isArray(featureMatrix[0])) return featureMatrix;

    // Single frame — just return it
    if (featureMatrix.length === 1) return featureMatrix[0];

    const frameCount = featureMatrix.length;
    const dims = featureMatrix[0].length;
    const mean = new Array(dims).fill(0);

    for (let f = 0; f < frameCount; f++) {
        for (let d = 0; d < dims; d++) {
            mean[d] += featureMatrix[f][d];
        }
    }

    for (let d = 0; d < dims; d++) {
        mean[d] /= frameCount;
    }

    return mean;
};

const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// registerUnknownGait
// POST /api/predict/register
// Body: { person_name: string, feature_vector: number[] }
// Creates a new GaitProfile in the database so the person is recognizable
// in future predictions.
// ─────────────────────────────────────────────────────────────────────────────
export const registerUnknownGait = async (req, res, next) => {
    try {
        const { person_name, feature_vector } = req.body;

        if (!person_name || typeof person_name !== "string" || !person_name.trim()) {
            return next(new Error("person_name is required", { cause: 400 }));
        }

        if (!Array.isArray(feature_vector) || feature_vector.length === 0) {
            return next(new Error("feature_vector must be a non-empty array", { cause: 400 }));
        }

        const profile = await GaitProfileModel.create({
            user_id: req.user._id,
            file_name: `registered_${Date.now()}.bin`,
            file_size: 0,
            description: `Manually registered via prediction dialog`,
            condition: "normal",
            person_name: person_name.trim(),
            status: "completed",
            vector_status: "completed",
            feature_vector,
            feature_dimensions: feature_vector.length,
        });

        console.log(`[Predict/Register] Saved new gait profile for "${person_name.trim()}" (id=${profile._id})`);

        return {
            statusCode: 201,
            data: {
                profile_id: profile._id,
                person_name: profile.person_name,
                feature_dimensions: profile.feature_dimensions,
                message: `Gait profile for "${profile.person_name}" saved successfully.`,
            },
        };
    } catch (error) {
        console.error("[Predict/Register] Error:", error.message);
        return next(new Error("Failed to register gait profile", { cause: 500 }));
    }
};

export const forwardPrediction = async (req, res, next) => {
    const requestStartedAt = new Date().toISOString();
    const hasFiles = Array.isArray(req.files) && req.files.length > 0;

    if (hasFiles) {
        const f = req.files[0];
        console.log(`[Predict] ${requestStartedAt} | file=${f.originalname} type=${f.mimetype} size=${(f.size / 1024 / 1024).toFixed(2)}MB`);
    }

    try {
        const payload = hasFiles ? buildMultipartPayload(req) : buildJsonPayload(req);
        const headers = hasFiles ? {} : { "Content-Type": "application/json" };

        if (process.env.HF_TOKEN) {
            headers["Authorization"] = `Bearer ${process.env.HF_TOKEN}`;
        }

        const response = await axios.post(EXTERNAL_PREDICT_API_URL, payload, {
            headers,
            timeout: REQUEST_TIMEOUT,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });

        const raw = response.data;

        // ── Post-process the response ────────────────────────────────────────
        const rawVector = raw?.feature_vector ?? null;
        const isVideo = Array.isArray(rawVector) && Array.isArray(rawVector[0]) && rawVector.length > 1;
        const frameCount = isVideo ? rawVector.length : null;

        // Compute mean vector for multi-frame video → prevents browser crash
        const meanVector = rawVector ? computeMeanVector(rawVector) : null;

        // ── Compare with stored profiles in DB ───────────────────────────────
        let topMatches = [];
        let claudeInsight = null;
        if (meanVector && meanVector.length > 0) {
            try {
                // Fetch all profiles that have a completed feature vector
                // Depending on requirements, we can filter by req.user._id to only match the current user's profiles,
                // or search the entire DB. Here we search all profiles across the system.
                const profiles = await GaitProfileModel.find({ 
                    vector_status: "completed", 
                    feature_vector: { $exists: true, $ne: [] } 
                }).lean();

                const scoredProfiles = [];

                for (const profile of profiles) {
                    if (profile.feature_vector && profile.feature_vector.length === meanVector.length) {
                        const score = cosineSimilarity(meanVector, profile.feature_vector);
                        scoredProfiles.push({
                            person_name: profile.person_name || "Unknown",
                            condition: profile.condition,
                            score: Number(score.toFixed(4)),
                            profile_id: profile._id
                        });
                    }
                }

                // Sort by score descending
                scoredProfiles.sort((a, b) => b.score - a.score);

                // Get top 3
                topMatches = scoredProfiles.slice(0, 3);
                
                console.log(`[Predict] Found ${topMatches.length} top matches.`);

                // Call Anthropic API to get insight
                if (topMatches.length > 0) {
                    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== "dummy") {
                        try {
                            const prompt = `Analyze these top gait matches and provide a dynamic, short 2-sentence insight. Focus on the confidence levels and what they mean:\n${JSON.stringify(topMatches, null, 2)}`;
                            const anthropicResponse = await anthropic.messages.create({
                                model: "claude-3-haiku-20240307",
                                max_tokens: 150,
                                messages: [{ role: "user", content: prompt }]
                            });
                            claudeInsight = anthropicResponse.content[0].text;
                        } catch (aiErr) {
                            console.error("[Predict] Anthropic API failed:", aiErr.message);
                            claudeInsight = null;
                        }
                    } else {
                        claudeInsight = null;
                    }
                }
            } catch (dbErr) {
                console.error("[Predict] Error comparing vectors:", dbErr.message);
            }
        }

        // --- DASHBOARD LOGGING (analysis stats only — no profile saved) ---
        // Feature vectors are only persisted when the user explicitly provides a
        // name via POST /api/predict/register (the registration dialog).
        if (req.user && meanVector && meanVector.length > 0) {
            try {
                await GaitAnalysisModel.create({
                    user_id: req.user._id,
                    gait_profile_id: null,  // no forced profile — user decides later
                    status: "completed",
                    confidence_score: topMatches.length > 0 ? topMatches[0].score * 100 : 0,
                    completed_at: new Date(),
                    result: {
                        gait_pattern: "Extracted via AI",
                        file_name: hasFiles ? req.files[0].originalname : "Quick Upload",
                    },
                    ai_response: { topMatches, claudeInsight },
                    processing_time_ms: Date.now() - new Date(requestStartedAt).getTime()
                });
            } catch(e) {
                console.error("[Predict] Failed to save analysis log to dashboard:", e);
            }
        }
        // ----------------------------------

        console.log(
            `[Predict] OK | frames=${frameCount ?? "N/A (image)"} | dims=${meanVector?.length ?? 0} | rawBytes≈${JSON.stringify(rawVector).length}`
        );

        return {
            statusCode: 200,
            data: {
                // ── Clean, browser-safe response ──
                isVideo,
                frameCount,
                featureDimensions: meanVector?.length ?? 0,
                meanFeatureVector: meanVector,     // Single 1D vector — safe for browser
                topMatches,                        // The top 3 matching persons from the DB
                claudeInsight,                     // The generated insight from Claude
                message: raw?.message ?? null,
                error: raw?.error ?? null,

                // ── Debug metadata ──
                forwardedTo: EXTERNAL_PREDICT_API_URL,
                contentType: hasFiles ? "multipart/form-data" : "application/json",
            },
        };
    } catch (error) {
        const apiError = extractAxiosError(error);

        console.error("[Predict] FAILED:", {
            message: error.message,
            code: error.code,
            status: error.response?.status,
        });

        return next(
            new Error(apiError.message, { cause: apiError.statusCode })
        );
    }
};

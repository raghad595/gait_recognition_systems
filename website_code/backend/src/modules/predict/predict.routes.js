import { Router } from "express";
import { predictUpload } from "../../middleware/predictUpload.middleware.js";
import { authentication } from "../../middleware/authenticaion.middleware.js";
import * as predictService from "./predict.service.js";

const router = Router();

// ── POST /api/predict ─────────────────────────────────────────────────────────
// Forward file to Hugging Face Space — logged to dashboard
router.post(
    "/",
    authentication(),
    predictUpload.any(),
    async (req, res, next) => {
        try {
            const result = await predictService.forwardPrediction(req, res, next);

            if (result && !res.headersSent) {
                return res.status(result.statusCode).json({
                    success: true,
                    data: result.data,
                    error: null
                });
            }
        } catch (err) {
            next(err);
        }
    }
);

// ── POST /api/predict/save ────────────────────────────────────────────────────
// Save a completed prediction result to MongoDB.
// Requires JWT auth to associate the result with a user.
router.post(
    "/save",
    authentication(),
    async (req, res, next) => {
        const result = await predictService.savePrediction(req, res, next);

        if (result && !res.headersSent) {
            return res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// ── POST /api/predict/register ────────────────────────────────────────────────
// Register an unknown gait signature detected during prediction.
// Body: { person_name: string, feature_vector: number[] }
// Saves a new GaitProfile so future predictions can recognize this person.
router.post(
    "/register",
    authentication(),
    async (req, res, next) => {
        try {
            const result = await predictService.registerUnknownGait(req, res, next);

            if (result && !res.headersSent) {
                return res.status(result.statusCode).json({
                    success: true,
                    data: result.data,
                    error: null
                });
            }
        } catch (err) {
            next(err);
        }
    }
);

// ── GET /api/predict/history ──────────────────────────────────────────────────
// Get the current user's saved analysis history.
router.get(
    "/history",
    authentication(),
    async (req, res, next) => {
        const result = await predictService.getPredictionHistory(req, res, next);

        if (result && !res.headersSent) {
            return res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

export default router;

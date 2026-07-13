import { Router } from "express";
import * as analysisService from "./analysis.service.js";
import { authentication } from "../../middleware/authenticaion.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";

import {
    runAnalysisValidation,
    getAnalysisResultValidation,
    listAnalysisHistoryValidation,
    getProfileAnalysisValidation
} from "./analysis.validation.js";

const router = Router();

// Apply authentication to all routes
router.use(authentication());

// Run analysis on a gait profile
router.post(
    '/run',
    validation(runAnalysisValidation),
    async (req, res, next) => {
        const result = await analysisService.runAnalysis(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// Get single analysis result
router.get(
    '/:analysisId',
    validation(getAnalysisResultValidation),
    async (req, res, next) => {
        const result = await analysisService.getAnalysisResult(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// Get user's analysis history
router.get(
    '/',
    validation(listAnalysisHistoryValidation),
    async (req, res, next) => {
        const result = await analysisService.listAnalysisHistory(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// Get analysis history for a specific gait profile
router.get(
    '/profile/:profileId/history',
    validation(getProfileAnalysisValidation),
    async (req, res, next) => {
        const result = await analysisService.getProfileAnalysisHistory(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// Get analysis statistics
router.get(
    '/stats/summary',
    async (req, res, next) => {
        const result = await analysisService.getAnalysisStatistics(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

export default router;

import * as settingsService from "./settings.service.js";

/**
 * GET /api/settings/profile
 */
export const getProfile = async (req, res, next) => {
    try {
        const data = await settingsService.getProfile(req.user._id);
        return res.status(200).json({
            success: true,
            data,
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * PATCH /api/settings/profile
 */
export const updateProfile = async (req, res, next) => {
    try {
        const data = await settingsService.updateProfile(req.user._id, req.body);
        return res.status(200).json({
            success: true,
            data,
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * GET /api/settings/model
 */
export const getModelConfig = async (req, res, next) => {
    try {
        const data = await settingsService.getModelConfig();
        return res.status(200).json({
            success: true,
            data,
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * PATCH /api/settings/model
 */
export const updateModelConfig = async (req, res, next) => {
    try {
        const data = await settingsService.updateModelConfig(req.body);
        return res.status(200).json({
            success: true,
            data,
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

import Joi from 'joi';

export const runAnalysisValidation = Joi.object({
    gait_profile_id: Joi.string().required()
}).unknown(true);

export const getAnalysisResultValidation = Joi.object({
    analysisId: Joi.string().required()
}).unknown(true);

export const listAnalysisHistoryValidation = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    status: Joi.string().optional()
}).unknown(true);

export const getProfileAnalysisValidation = Joi.object({
    profileId: Joi.string().required(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10)
}).unknown(true);

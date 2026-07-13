import Joi from "joi";

export const updateProfileValidation = {
    body: Joi.object({
        fullName: Joi.string().min(3).max(40),
        institution: Joi.string().allow("").max(100)
    }).required()
};

export const updateModelConfigValidation = {
    body: Joi.object({
        similarityThreshold: Joi.number().min(0).max(1).required(),
        frameSamplingRate: Joi.number().integer().positive().required()
    }).required()
};

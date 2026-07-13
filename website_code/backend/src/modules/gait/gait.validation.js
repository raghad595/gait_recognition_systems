import Joi from 'joi';

export const uploadGaitValidation = Joi.object({
    description: Joi.string().max(500).optional(),
    condition: Joi.string().valid("normal", "bag", "coat").default("normal"),
    person_name: Joi.string().max(100).optional()
}).unknown(true); // Allow file field from multer

export const getGaitProfileValidation = Joi.object({
    profileId: Joi.string().required()
}).unknown(true);

export const updateGaitProfileValidation = Joi.object({
    description: Joi.string().max(500).optional()
}).unknown(true);

export const deleteGaitProfileValidation = Joi.object({
    profileId: Joi.string().required()
}).unknown(true);

export const listGaitProfilesValidation = Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(500).default(10)
}).unknown(true);

import Joi from 'joi';
import { genderEnum } from '../../db/models/user.model.js';

export const updateProfileValidation = Joi.object({
    fullName: Joi.string().min(3).max(40),
    gender: Joi.string().valid(...Object.values(genderEnum)),
    phone: Joi.string()
}).unknown(true);

export const updateRoleValidation = {
    body: Joi.object({
        role: Joi.string().valid('USER', 'ADMIN', 'RESEARCHER', 'SECURITY_OFFICER').required()
    }).required(),
    params: Joi.object({
        userId: Joi.string().required()
    }).required()
};

export const userIdValidation = {
    params: Joi.object({
        userId: Joi.string().required()
    }).required()
};


import joi from "joi";
import { generalFields } from "../../middleware/validation.middleware.js";
import { logoutEnum } from "../../utils/Token/token.utils.js";

export const signUpValidation = {
    body: joi.object({
        fullName: generalFields.fullName.required(),
        email: generalFields.email.required(),
        password: generalFields.password.required(),
        confirmPassword: generalFields.confirmPassword,
        gender: generalFields.gender,
        phone: generalFields.phone
    }).required(),
};

export const loginValidation = {
    body: joi.object({
        email: generalFields.email.required(),
        password: generalFields.password.required(),
    }).required(),
};

export const socialLoginValidation = {
    body: joi.object({
        idToken: joi.string().required()
    }).required(),
};

export const confirmEmailValidation = {
    body: joi.object({
        email: generalFields.email.required(),
        otp: generalFields.otp.required()
    }).required(),
};

export const forgetPasswordValidation = {
    body: joi.object({
        email: generalFields.email.required(),

    }).required(),
};

export const resetPasswordValidation = {
    body: joi.object({
        email: generalFields.email.required(),
        otp: generalFields.otp.required(),
        password: generalFields.password.required(),
        confirmPassword: generalFields.confirmPassword
    })
};

export const logoutValidation = {
    body: joi.object({
        flag: joi.string().valid(...Object.values(logoutEnum)).default(logoutEnum.stayloggedIn)
    })
        .required(),
};

export const resendEmailOtpValidation = {
    body: joi.object({
        email: generalFields.email.required()
    }).required(),
};

export const resendForgotPasswordOtpValidation = {
    body: joi.object({
        email: generalFields.email.required()
    }).required(),
};
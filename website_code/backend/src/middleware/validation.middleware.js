import joi from "joi";
import { Types } from "mongoose";


export const generalFields = {
    fullName: joi
        .string()
        .trim()
        .min(3)
        .max(50)
        .required()
        .messages({
            "string.empty": "Full name is required",
            "string.min": "Full name must be at least 3 characters long",
            "string.max": "Full name must be at most 50 characters long",
            "any.required": "Full name is required"
        }),

    email: joi
        .string()
        .trim()
        .lowercase()
        .email({
            minDomainSegments: 2,
            tlds: { allow: ["com", "net", "org", "io", "eg"] }
        })
        .required()
        .messages({
            "string.empty": "Email is required",
            "string.email": "Please provide a valid email address",
            "any.required": "Email is required"
        }),

    password: joi
        .string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
        .required()
        .messages({
            "string.empty": "Password is required",
            "string.pattern.base":
                "Password must be at least 8 characters and contain: uppercase, lowercase, number, and special character (@$!%*?&#)",
            "any.required": "Password is required"
        }),

    confirmPassword: joi
        .string()
        .valid(joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords must match",
            "string.empty": "Password confirmation is required",
            "any.required": "Password confirmation is required"
        }),

    gender: joi
        .string()
        .valid("male", "female")
        .required()
        .messages({
            "any.only": "Gender must be either 'male' or 'female'",
            "any.required": "Gender is required"
        }),

    role: joi
        .string()
        .valid("USER", "ADMIN", "RESEARCHER", "SECURITY_OFFICER")
        .default("USER")
        .messages({
            "any.only": "Role must be one of: USER, ADMIN, RESEARCHER, or SECURITY_OFFICER"
        }),

    phone: joi
        .string()
        .allow("")
        .pattern(/^(\+20|0020|0)?1[0125]\d{8}$/)
        .messages({
            "string.empty": "Phone number is required",
            "string.pattern.base": "Please provide a valid Egyptian phone number",
            "any.required": "Phone number is required"
        }),

    id: joi.string().custom((value, helper) => {
        return Types.ObjectId.isValid(value) || helper.message("Invalid ID format");
    }),
    age: joi
        .number()
        .integer()
        .min(13)
        .max(120)
        .messages({
            "number.base": "Age must be a number",
            "number.integer": "Age must be a whole number",
            "number.min": "You must be at least 13 years old",
            "number.max": "Please enter a valid age",
            "any.required": "Age is required"
        }),
    otp: joi
        .string()
        .length(6)
        .pattern(/^[0-9]{6}$/)
        .required()
        .messages({
            "string.empty": "OTP is required",
            "string.length": "OTP must be exactly 6 digits",
            "string.pattern.base": "OTP must contain only numbers",
            "any.required": "OTP is required"
        }),
    file: {
        fieldname: joi.string(),
        originalname: joi.string(),
        encoding: joi.string(),
        mimetype: joi.string(),
        size: joi.number(),
        destination: joi.string(),
        filename: joi.string(),
        path: joi.string(),
        finalPath: joi.string()

    }
};

export const validation = (Schema) => {
    return (req, res, next) => {
        const validationError = [];

        // Support direct Joi schema usage by validating merged request inputs.
        if (Schema?.isJoi || typeof Schema?.validate === "function") {
            const payload = { ...req.params, ...req.query, ...req.body };
            const validationResults = Schema.validate(payload, { abortEarly: false });
            if (validationResults.error) {
                validationError.push({ key: "request", details: validationResults.error.details });
            }
        } else {
            for (const key of Object.keys(Schema || {})) {
                const currentSchema = Schema[key];
                if (!currentSchema || typeof currentSchema.validate !== "function") continue;

                const validationResults = currentSchema.validate(req[key], {
                    abortEarly: false,
                });
                if (validationResults.error) {
                    validationError.push({ key, details: validationResults.error.details });
                }
            }
        }

        if (validationError.length)
            return res.status(400).json({ error: "Validation Error", details: validationError })

        return next();
    };
};

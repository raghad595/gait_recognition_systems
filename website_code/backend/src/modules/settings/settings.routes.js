import { Router } from "express";
import * as settingsController from "./settings.controller.js";
import { authentication, authorization } from "../../middleware/authenticaion.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import { roles } from "../../db/models/user.model.js";
import { updateProfileValidation, updateModelConfigValidation } from "./settings.validation.js";

const router = Router();

// Apply authentication to all settings routes
router.use(authentication());

// Profile Settings
router.get("/profile", settingsController.getProfile);
router.patch("/profile", validation(updateProfileValidation), settingsController.updateProfile);

// Model Settings
router.get("/model", settingsController.getModelConfig);
router.patch(
    "/model", 
    authorization({ accessRoles: [roles.admin] }), // Corrected usage of authorization middleware
    validation(updateModelConfigValidation), 
    settingsController.updateModelConfig
);

export default router;

import { Router } from "express";
import * as gaitService from "./gait.service.js";
import { authentication } from "../../middleware/authenticaion.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import {
    uploadGaitValidation,
    getGaitProfileValidation,
    updateGaitProfileValidation,
    deleteGaitProfileValidation,
    listGaitProfilesValidation
} from "./gait.validation.js";
import { cloudinaryUpload } from "../../utils/multer/cloud.multer.js";
import { localFileUpload, fileValidation } from "../../utils/multer/local.multer.js";

const router = Router();

// Apply authentication to all routes
router.use(authentication());

// Helper — evaluated at request time so dotenv has already run
const isCloudinaryReady = () =>
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloudinary_cloud_name" &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_KEY !== "your_cloudinary_api_key" &&
    process.env.CLOUDINARY_API_SECRET &&
    process.env.CLOUDINARY_API_SECRET !== "your_cloudinary_api_secret";

// Lazy multer selector — picks cloud or local at request time
const lazyVideoUpload = (req, res, next) => {
    const upload = isCloudinaryReady()
        ? cloudinaryUpload().single("video")
        : localFileUpload({
              customPath: "gait-videos",
              validation: fileValidation.videos,
          }).single("video");
    upload(req, res, next);
};

// Upload gait video
router.post(
    '/upload',
    lazyVideoUpload,
    validation(uploadGaitValidation),
    async (req, res, next) => {
        const result = await gaitService.uploadGaitVideo(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// Get single gait profile
router.get(
    '/:profileId',
    validation(getGaitProfileValidation),
    async (req, res, next) => {
        const result = await gaitService.getGaitProfile(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// List all gait profiles
router.get(
    '/',
    validation(listGaitProfilesValidation),
    async (req, res, next) => {
        const result = await gaitService.listGaitProfiles(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// Update gait profile
router.patch(
    '/:profileId',
    validation(updateGaitProfileValidation),
    async (req, res, next) => {
        const result = await gaitService.updateGaitProfile(req, res, next);
        if (result && !res.headersSent) {
            res.status(result.statusCode).json({
                success: true,
                data: result.data,
                error: null
            });
        }
    }
);

// Delete gait profile
router.delete(
    '/:profileId',
    validation(deleteGaitProfileValidation),
    async (req, res, next) => {
        const result = await gaitService.deleteGaitProfile(req, res, next);
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

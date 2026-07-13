import { Router } from "express";
import * as dashboardController from "./dashboard.controller.js";
import { authentication } from "../../middleware/authenticaion.middleware.js";

const router = Router();

// Secure all dashboard routes
router.use(authentication());

// Combined Stats
router.get("/stats", dashboardController.getAllStats);

// Recognition Accuracy Chart
router.get("/accuracy-chart", dashboardController.getAccuracyChart);

// System Status
router.get("/system-status", dashboardController.getSystemStatus);

// Recent Uploads Table
router.get("/recent-uploads", dashboardController.getRecentUploads);

export default router;

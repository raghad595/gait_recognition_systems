import { Router } from "express";
import * as reportsController from "./reports.controller.js";
import { authentication } from "../../middleware/authenticaion.middleware.js";

const router = Router();

// Apply authentication to all report routes
router.use(authentication());

router.get("/summary", reportsController.getSummary);
router.get("/accuracy-by-condition", reportsController.getAccuracyByCondition);
router.get("/dataset-distribution", reportsController.getDatasetDistribution);
router.get("/export", reportsController.exportReports);

export default router;

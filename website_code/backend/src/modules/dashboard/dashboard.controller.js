import * as dashboardService from "./dashboard.service.js";


/**
 * GET /dashboard/accuracy-chart
 */
export const getAccuracyChart = async (req, res, next) => {
    try {
        const chartData = await dashboardService.getAccuracyChartData();
        return res.status(200).json({
            success: true,
            data: chartData,
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * GET /dashboard/system-status
 */
export const getSystemStatus = async (req, res, next) => {
    try {
        const status = await dashboardService.getSystemStatus();
        return res.status(200).json({
            success: true,
            data: status,
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * GET /dashboard/recent-uploads
 */
export const getRecentUploads = async (req, res, next) => {
    try {
        const uploads = await dashboardService.getRecentUploads();
        return res.status(200).json({
            success: true,
            data: uploads,
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

/**
 * Aggregate all stats in one call if needed (utility)
 */
export const getAllStats = async (req, res, next) => {
    try {
        const [subjects, videos, accuracy, sessions] = await Promise.all([
            dashboardService.getSubjectsStats(),
            dashboardService.getVideosStats(),
            dashboardService.getAccuracyStats(),
            dashboardService.getSessionsStats()
        ]);
        
        return res.status(200).json({
            success: true,
            data: {
                totalSubjects: subjects,
                processedVideos: videos,
                accuracy: accuracy,
                activeSessions: sessions
            },
            error: null
        });
    } catch (error) {
        return next(error);
    }
};

import mongoose from "mongoose";
import { UserModel, roles } from "../../db/models/user.model.js";
import { GaitProfileModel } from "../gait/gait.model.js";
import { GaitAnalysisModel } from "../analysis/analysis.model.js";
import TokenModel from "../../db/models/token.model.js";

// Basic in-memory cache configuration for stats and charts (TTL: 30 seconds)
const cache = new Map();
const CACHE_TTL_MS = 30000; 

const withCache = async (key, fetchFn) => {
    const cached = cache.get(key);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return cached.data;
    }
    const data = await fetchFn();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
};

/**
 * Get total subjects count
 */
export const getSubjectsStats = async () => {
    return withCache('subjects_stats', async () => {
        // Total unique subjects identified by gait profiles
        const uniqueUsers = await GaitProfileModel.distinct("user_id");
        return uniqueUsers.length;
    });
};

/**
 * Get processed videos count
 */
export const getVideosStats = async () => {
    return withCache('videos_stats', async () => {
        // Fast count where status is completed
        return await GaitAnalysisModel.countDocuments({ status: "completed" });
    });
};

/**
 * Get recognition accuracy (average confidence score or actual accuracy)
 */
export const getAccuracyStats = async () => {
    return withCache('accuracy_stats', async () => {
        const result = await GaitAnalysisModel.aggregate([
            { $match: { status: "completed" } },
            {
                $group: {
                    _id: null,
                    // If ground truth processing was more complex, we'd adjust this calculation. 
                    // Leveraging average confidence score as requested when no true metric is defined yet.
                    avgAccuracy: { $avg: "$confidence_score" }
                }
            }
        ]);
        
        return result.length > 0 ? parseFloat(result[0].avgAccuracy.toFixed(1)) : 0;
    });
};

/**
 * Get active sessions count
 */
export const getSessionsStats = async () => {
    return withCache('sessions_stats', async () => {
        // active sessions -> videos currently processing
        return await GaitAnalysisModel.countDocuments({ status: "processing" });
    });
};

/**
 * Get data for accuracy chart (time-series)
 */
export const getAccuracyChartData = async () => {
    return withCache('accuracy_chart', async () => {
        const analysisData = await GaitAnalysisModel.aggregate([
            { 
                $match: { 
                    status: "completed",
                    completed_at: { $exists: true }
                } 
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%H:00", date: "$completed_at" } },
                    avgAccuracy: { $avg: "$confidence_score" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        return analysisData.map(item => ({
            time: item._id,
            accuracy: Math.round(item.avgAccuracy || 0)
        }));
    });
};

/**
 * Get system status
 */
export const getSystemStatus = async () => {
    return withCache('system_status', async () => {
        // Check DB connection
        const isDbOnline = mongoose.connection.readyState === 1;

        // Model Inference online if a recent successful analysis was logged (last 5 mins)
        const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentSuccess = await GaitAnalysisModel.findOne({ 
            status: "completed", 
            completed_at: { $gte: fiveMinsAgo } 
        }).lean();
        
        // Find newest completed timestamp for sync
        const lastCompleted = await GaitAnalysisModel.findOne({ status: "completed" })
            .sort({ completed_at: -1 })
            .lean();

        return {
            modelInference: recentSuccess ? "online" : "offline",
            database: isDbOnline ? "online" : "offline",
            lastSync: lastCompleted && lastCompleted.completed_at ? formatTimeAgo(lastCompleted.completed_at) : "Never"
        };
    });
};

/**
 * Get recent uploads
 */
export const getRecentUploads = async (limit = 10) => {
    // Shorter TTL for recent uploads (10s)
    const CACHED_UPLOADS = cache.get(`recent_uploads`);
    if (CACHED_UPLOADS && (Date.now() - CACHED_UPLOADS.timestamp < 10000)) {
        return CACHED_UPLOADS.data;
    }

    const recentProfiles = await GaitProfileModel.aggregate([
        { $sort: { createdAt: -1 } },
        { $limit: limit },
        {
            $lookup: {
                from: "gaitanalyses",
                localField: "_id",
                foreignField: "gait_profile_id",
                as: "analysis"
            }
        },
        {
            $unwind: { path: "$analysis", preserveNullAndEmptyArrays: true }
        },
        // In case multiple analyses exist for one profile, we group back and take first (already sorted by newest profile, and analysis unwinds logically but we want just 1)
        {
            $group: {
                _id: "$_id",
                createdAt: { $first: "$createdAt" },
                file_name: { $first: "$file_name" },
                user_id: { $first: "$user_id" },
                profile_status: { $first: "$status" },
                analysis: { $first: "$analysis" }
            }
        },
        { $sort: { createdAt: -1 } }
    ]);

    const formattedUploads = recentProfiles.map(profile => {
        let status = "processing";
        if (profile.analysis) {
            if (profile.analysis.status === "completed") status = "identified";
            else if (profile.analysis.status === "failed") status = "failed";
            else status = "processing";
        } else if (profile.profile_status === "failed") {
            status = "failed";
        }

        return {
            id: profile._id.toString().substring(0, 8),
            filename: profile.file_name,
            subject: `Subject #${profile.user_id.toString().substring(0, 4)}`,
            status: status,
            score: profile.analysis?.confidence_score ? (profile.analysis.confidence_score / 100).toFixed(2) : 0,
            time: formatTimeAgo(profile.createdAt)
        };
    });

    cache.set(`recent_uploads`, { data: formattedUploads, timestamp: Date.now() });
    return formattedUploads;
};

/**
 * Helper to format time ago
 */
function formatTimeAgo(date) {
    if (!date) return "N/A";
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 0) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min ago";
    return Math.floor(seconds) + " sec ago";
}

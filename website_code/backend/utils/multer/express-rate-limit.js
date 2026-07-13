import rateLimit from 'express-rate-limit'

const toMs = (value, fallback) => {
    if (value === undefined || value === null || value === "") return fallback;
    if (typeof value === "number") return Number.isFinite(value) ? value : fallback;

    const str = String(value).trim().toLowerCase();
    if (/^\d+$/.test(str)) return Number(str);

    const match = str.match(/^(\d+)\s*(ms|s|m|h|d)$/);
    if (!match) return fallback;

    const amount = Number(match[1]);
    const unit = match[2];
    const multipliers = {
        ms: 1,
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000
    };

    return amount * multipliers[unit];
};

const toNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isProduction = process.env.NODE_ENV === "production";

const defaultWindowMs = isProduction ? 15 * 60 * 1000 : 60 * 1000;
const defaultLimit = isProduction ? 100 : 10000;

export const limiter = rateLimit({
        windowMs: toMs(process.env.RATE_LIMIT_WINDOW, defaultWindowMs),
        limit: toNumber(process.env.RATE_LIMIT_MAX, defaultLimit),
        // Don't rate-limit CORS preflight checks; they can otherwise block real requests.
        skip: (req) => req.method === "OPTIONS",
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: 429,
            message: "Too many requests from this IP, please try again"
        },
});

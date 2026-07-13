export const globalErrorHandler = (err, req, res, next) => {
    const isMulterFileSizeError = err?.name === "MulterError" && err?.code === "LIMIT_FILE_SIZE";
    const isJwtExpired = err?.name === "TokenExpiredError";
    const isJwtInvalid = err?.name === "JsonWebTokenError";
    const isJwtError   = isJwtExpired || isJwtInvalid;

    let status = err.cause || (isMulterFileSizeError ? 400 : isJwtError ? 401 : 500);
    const message = isMulterFileSizeError
        ? "Uploaded file is too large"
        : isJwtExpired
        ? "Session expired, please log in again"
        : err.message || "Internal Server Error";

    return res.status(status).json({
        success: false,
        data: null,
        message,
        error: message
    });
};

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
    const status = err.status || err.cause || 500;
    const message = err.message || "Internal Server Error";
    
    res.status(status).json({
        message: "Something went wrong",
        error: message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack
    });
};

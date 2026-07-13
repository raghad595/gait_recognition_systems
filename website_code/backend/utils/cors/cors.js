const DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:8080",
    "http://127.0.0.1:8080"
];

const buildAllowedOrigins = () => {
    const configuredOrigins = (process.env.CORS_ORIGIN || "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

    return [...new Set([...DEFAULT_ALLOWED_ORIGINS, ...configuredOrigins])];
};

export function corsOptions() {
    const allowedOrigins = buildAllowedOrigins();

    return {
        origin(origin, callback) {
            // Allow non-browser tools like curl/Postman and same-origin server calls.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`Origin ${origin} is not allowed by CORS`, { cause: 403 }));
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: true,
        optionsSuccessStatus: 204
    };
}

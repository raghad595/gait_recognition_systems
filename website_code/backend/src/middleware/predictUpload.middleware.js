import multer from "multer";
import path from "node:path";

const allowedMimeTypes = [
    "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif",
    "video/mp4", "video/x-msvideo", "video/avi", "video/quicktime", "video/x-matroska", "video/webm", "video/mpeg", "video/mpg", "video/3gpp"
];

const allowedExtensions = [
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".mp4", ".avi", ".mov", ".mkv", ".webm", ".mpeg", ".mpg"
];

const maxFileSize = Number(process.env.PREDICT_MAX_FILE_SIZE || 50 * 1024 * 1024); // Increased to 50MB for videos

export const predictUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: maxFileSize
    },
    fileFilter: (req, file, cb) => {
        const mimeAllowed = allowedMimeTypes.includes(file.mimetype);
        
        const ext = path.extname(file.originalname).toLowerCase();
        const extAllowed = allowedExtensions.includes(ext);

        if (mimeAllowed || extAllowed) {
            return cb(null, true);
        }

        return cb(new Error("Only images (JPG, PNG, WEBP) and videos (MP4, AVI, MOV, MKV, WEBM) are allowed", { cause: 400 }));
    }
});



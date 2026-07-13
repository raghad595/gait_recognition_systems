import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { cloudinaryConfig } from './cloudinary.js';

export const cloudFileUpload = ({ validation = [] }) => {

    const storage = multer.diskStorage({})
    const fileFilter = (req, file, cb) => {
        if (validation.includes(file.mimetype)) {
            cb(null, true);
        } else {
            return cb(new Error("Invalid File Type"), false)
        }
    }
    return multer({
        fileFilter,
        storage,
    })
}

export const cloudinaryUpload = ({ customPath = "general", validation = [] } = {}) => {
    let basePath = `uploads/${customPath}`;

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            if (req.user?._id) basePath += `/${req.user._id}`;

            const fullPath = path.resolve(`./Src/${basePath}`);

            if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
            cb(null, path.resolve(fullPath));
        },
        filename: (req, file, cb) => {
            const uniqueFileName = Date.now() + "__" + Math.random() + "__" + file.originalname;
            file.finalPath = `${basePath}/${uniqueFileName}`;
            cb(null, uniqueFileName);
        }
    });

    const fileFilter = (req, file, cb) => {
        const videoMimeTypes = [
            "video/mp4", "video/mpeg", "video/avi", "video/quicktime", 
            "video/webm", "video/x-matroska", "video/x-msvideo"
        ];
        if (videoMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            return cb(new Error("Invalid Video Type"), false);
        }
    };


    return multer({
        fileFilter,
        storage,
        limits: {
            fileSize: 500 * 1024 * 1024 // 500MB
        }
    });
}

export const uploadToCloudinary = async ({
    filePath,
    folder,
    options = {},
    next,
    resourceType = "auto"
}) => {
    if (!filePath) {
        return next(new Error("filePath is required for Cloudinary upload"));
    }

    return await cloudinaryConfig().uploader.upload(filePath, {
        folder,
        resource_type: resourceType,
        ...options
    });
}

export const destroyToCloudinary = async ({
    filePath,
    next,
    options = {},
    resourceType = "image"
}) => {
    if (!filePath) {
        return next(new Error("filePath is required for Cloudinary upload"));
    }

    return await cloudinaryConfig().uploader.destroy(filePath, {
        resource_type: resourceType,
        ...options
    });
}
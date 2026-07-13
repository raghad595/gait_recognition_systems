import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';

export const fileValidation = {
    image: ["image/png","image/jpeg","image/jpg"],
    videos: ["video/mp4", "video/mpeg", "video/avi", "video/quicktime", "video/webm", "video/x-msvideo"],
    audios:["audio/mpeg","audio/mp3","audio/wav"],
    documents:[
        "application/pdf" ,
        "application/msword" ,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ]
}
export const localFileUpload = ({customPath = "general" , validation = []}={})=>{
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = process.env.UPLOAD_PATH || 'uploads'
            const userFolder = req.user?._id ? req.user._id.toString() : 'general';
            const fullPath = path.resolve(uploadDir, customPath, userFolder)

            if(!fs.existsSync(fullPath)) fs.mkdirSync(fullPath , {recursive:true})
            cb(null , fullPath)
        },
        filename:(req,file,cb)=>{    
            const uniqueFileName = Date.now() + "__" + Math.random() + "__" + file.originalname
            const uploadDir = process.env.UPLOAD_PATH || 'uploads'
            const userFolder = req.user?._id ? req.user._id.toString() : 'general';
            file.finalPath = `${uploadDir}/${customPath}/${userFolder}/${uniqueFileName}`
            cb(null,uniqueFileName)
        }
    });
    const fileFilter = (req , file , cb)=>{
        const ext = path.extname(file.originalname).toLowerCase();
        const videoExtensions = [".mp4", ".avi", ".mov", ".mkv", ".webm", ".mpeg", ".mpg"];
        const isVideoValidation = Array.isArray(validation) && validation.some(v => v.startsWith("video/"));

        if(validation.includes(file.mimetype) || (isVideoValidation && videoExtensions.includes(ext))){
            cb(null,true);
        }else{
            return cb(new Error("Invalid File Type"),false)
        }
    }

    return multer({
        fileFilter,
        storage,
    })
};
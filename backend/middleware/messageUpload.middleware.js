// middlewares/messageUpload.middleware.js
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/messages/");
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `msg-${unique}${path.extname(file.originalname)}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowed = [
        "image/",
        "video/",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (
        allowed.some(type =>
            type.endsWith("/") ? file.mimetype.startsWith(type) : file.mimetype === type
        )
    ) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type"), false);
    }
};

export const messageUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 15 * 1024 * 1024, // ✅ 15 MB
    },
});

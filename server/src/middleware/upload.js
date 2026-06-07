import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

// Keep files in memory so we can stream the buffer straight to Cloudinary.
const storage = multer.memoryStorage();

function fileFilter(allowedPrefix, label) {
  return (req, file, cb) => {
    if (file.mimetype.startsWith(allowedPrefix)) cb(null, true);
    else cb(new ApiError(400, `Only ${label} files are allowed.`));
  };
}

export const uploadVideo = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
  fileFilter: fileFilter('video/', 'video'),
}).single('video');

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: fileFilter('image/', 'image'),
}).single('image');

// Any file type (assignment submissions: pdf, docx, zip, images, …).
export const uploadAny = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
}).single('file');

// Documents for AI study tools (PDF / DOCX / TXT / MD).
export const uploadDoc = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const okTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
    ];
    const okExt = /\.(pdf|docx|txt|md)$/i.test(file.originalname);
    if (okTypes.includes(file.mimetype) || okExt) cb(null, true);
    else cb(new ApiError(400, 'Upload a PDF, DOCX, TXT or MD file.'));
  },
}).single('file');

/**
 * Wrap a multer middleware so its errors (size/type) become clean ApiErrors
 * handled by the central error handler instead of crashing.
 */
export function runUpload(multerMw) {
  return (req, res, next) => {
    multerMw(req, res, (err) => {
      if (!err) return next();
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, 'File is too large.'));
        }
        return next(new ApiError(400, err.message));
      }
      return next(err); // already an ApiError from fileFilter
    });
  };
}

import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { isCloudinaryConfigured, uploadBuffer } from '../config/cloudinary.js';

function assertConfigured() {
  if (!isCloudinaryConfigured) {
    throw new ApiError(
      503,
      'File upload is not configured. Add CLOUDINARY_* keys to the server .env, ' +
        'or paste a video URL / use a text lesson instead.'
    );
  }
}

/**
 * POST /api/upload/video   (multipart field: "video")
 */
export const uploadVideoFile = asyncHandler(async (req, res) => {
  assertConfigured();
  if (!req.file) throw new ApiError(400, 'No video file provided.');

  const result = await uploadBuffer(req.file.buffer, {
    folder: 'ai-lms/videos',
    resourceType: 'video',
  });

  res.status(201).json({
    success: true,
    url: result.url,
    duration: result.duration,
    publicId: result.publicId,
  });
});

/**
 * POST /api/upload/thumbnail   (multipart field: "image")
 */
export const uploadThumbnailFile = asyncHandler(async (req, res) => {
  assertConfigured();
  if (!req.file) throw new ApiError(400, 'No image file provided.');

  const result = await uploadBuffer(req.file.buffer, {
    folder: 'ai-lms/thumbnails',
    resourceType: 'image',
  });

  res.status(201).json({ success: true, url: result.url, publicId: result.publicId });
});

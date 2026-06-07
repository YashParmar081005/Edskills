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

  let result;
  try {
    result = await uploadBuffer(req.file.buffer, {
      folder: 'ai-lms/videos',
      resourceType: 'video',
      chunked: true, // chunked upload — avoids the ~60s per-request timeout
      chunkSize: 6_000_000, // 6 MB chunks
      timeout: 600_000, // 10 min ceiling for the whole upload
    });
  } catch (err) {
    const msg = err?.message || 'Upload failed';
    // Cloudinary free plans cap video at 100 MB; surface that clearly.
    if (/file size too large|maximum.*allowed|too large/i.test(msg)) {
      throw new ApiError(
        413,
        'That video is too large for the current Cloudinary plan (free plans cap video at 100 MB). ' +
          'Use a smaller file or paste a hosted video URL instead.'
      );
    }
    if (/timeout|timed out/i.test(msg)) {
      throw new ApiError(504, 'The upload timed out. Check your connection and try a smaller file.');
    }
    throw new ApiError(502, `Video upload failed: ${msg}`);
  }

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

/**
 * POST /api/upload/avatar   (multipart field: "image")
 * Profile picture — any authenticated user.
 */
export const uploadAvatarFile = asyncHandler(async (req, res) => {
  assertConfigured();
  if (!req.file) throw new ApiError(400, 'No image file provided.');

  const result = await uploadBuffer(req.file.buffer, {
    folder: 'ai-lms/avatars',
    resourceType: 'image',
  });

  res.status(201).json({ success: true, url: result.url, publicId: result.publicId });
});

/**
 * POST /api/upload/file   (multipart field: "file") — any type
 * Used for assignment submissions. Accessible to any authenticated user.
 */
export const uploadGenericFile = asyncHandler(async (req, res) => {
  assertConfigured();
  if (!req.file) throw new ApiError(400, 'No file provided.');

  const result = await uploadBuffer(req.file.buffer, {
    folder: 'ai-lms/submissions',
    resourceType: 'auto',
  });

  res.status(201).json({
    success: true,
    url: result.url,
    fileName: req.file.originalname,
    publicId: result.publicId,
  });
});

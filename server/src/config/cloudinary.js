import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const { cloudName, apiKey, apiSecret } = env.cloudinary;

/** True only when all three Cloudinary credentials are present. */
export const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
  console.log('☁️  Cloudinary configured.');
} else {
  console.warn(
    '⚠️  Cloudinary not configured — file uploads disabled. ' +
      'Set CLOUDINARY_* in .env to enable (text lessons & pasted URLs still work).'
  );
}

/**
 * Upload an in-memory file buffer to Cloudinary.
 *
 * For large files (video) set `chunked: true` — this sends the file in smaller
 * chunks (each its own short HTTP request), which avoids Cloudinary's ~60s
 * per-request timeout that otherwise 500s long video uploads.
 *
 * @param {Buffer} buffer
 * @param {object} options - { folder, resourceType, chunked, chunkSize, timeout }
 * @returns {Promise<{ url, publicId, duration, bytes, format }>}
 */
export function uploadBuffer(
  buffer,
  { folder = 'ai-lms', resourceType = 'auto', chunked = false, chunkSize = 6_000_000, timeout = 120_000 } = {}
) {
  return new Promise((resolve, reject) => {
    const opts = { folder, resource_type: resourceType, timeout };
    const handle = (error, result) => {
      if (error) return reject(error);
      resolve({
        url: result.secure_url,
        publicId: result.public_id,
        duration: result.duration ? Math.round(result.duration) : 0,
        bytes: result.bytes,
        format: result.format,
      });
    };

    const stream = chunked
      ? cloudinary.uploader.upload_chunked_stream({ ...opts, chunk_size: chunkSize }, handle)
      : cloudinary.uploader.upload_stream(opts, handle);

    stream.end(buffer);
  });
}

export default cloudinary;

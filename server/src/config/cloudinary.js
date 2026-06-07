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
 * @param {Buffer} buffer
 * @param {object} options - { folder, resourceType: 'video'|'image'|'auto' }
 * @returns {Promise<{ url, publicId, duration, bytes, format }>}
 */
export function uploadBuffer(buffer, { folder = 'ai-lms', resourceType = 'auto' } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          duration: result.duration ? Math.round(result.duration) : 0,
          bytes: result.bytes,
          format: result.format,
        });
      }
    );
    stream.end(buffer);
  });
}

export default cloudinary;

import { v2 as cloudinary } from 'cloudinary';
import { ENV } from './env.js';

cloudinary.config({
  cloud_name: ENV.CLOUDINARY.CLOUD_NAME,
  api_key: ENV.CLOUDINARY.API_KEY,
  api_secret: ENV.CLOUDINARY.API_SECRET,
  secure: true
});

/**
 * Upload an image (base64 data-uri, buffer, or file path) to Cloudinary
 * @param {string|Buffer} fileInput 
 * @param {object} options 
 * @returns {Promise<object>} Cloudinary upload response
 */
export const uploadToCloudinary = async (fileInput, options = {}) => {
  const defaultOptions = {
    folder: 'betruegamers/avatars',
    resource_type: 'auto',
    transformation: [
      { width: 500, height: 500, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }
    ]
  };

  const uploadOptions = { ...defaultOptions, ...options };

  // If buffer, convert to base64 data URI
  let fileToUpload = fileInput;
  if (Buffer.isBuffer(fileInput)) {
    fileToUpload = `data:image/jpeg;base64,${fileInput.toString('base64')}`;
  }

  return await cloudinary.uploader.upload(fileToUpload, uploadOptions);
};

export { cloudinary };

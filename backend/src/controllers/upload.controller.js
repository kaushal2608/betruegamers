import { uploadToCloudinary } from '../config/cloudinary.js';

export const uploadController = {
  async uploadImage(req, res, next) {
    try {
      let fileInput = null;

      if (req.file) {
        fileInput = req.file.buffer;
      } else if (req.body?.image) {
        fileInput = req.body.image;
      }

      if (!fileInput) {
        return res.status(400).json({
          success: false,
          message: 'No image file or base64 image data provided'
        });
      }

      const folder = req.body?.folder || 'betruegamers/uploads';
      const result = await uploadToCloudinary(fileInput, { folder });

      return res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          url: result.secure_url,
          public_id: result.public_id,
          width: result.width,
          height: result.height,
          format: result.format
        }
      });
    } catch (err) {
      next(err);
    }
  }
};

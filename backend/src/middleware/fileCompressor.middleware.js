const { compressDiskFileIfNeeded } = require('../utils/fileCompressor');

/**
 * Middleware that automatically compresses uploaded images on disk to ~50KB-150KB
 * before passing execution to the controller.
 */
const compressUploadedFile = async (req, res, next) => {
  try {
    if (req.file && req.file.path) {
      await compressDiskFileIfNeeded(req.file.path);
    }
    if (req.files && Array.isArray(req.files)) {
      for (const f of req.files) {
        if (f.path) {
          await compressDiskFileIfNeeded(f.path);
        }
      }
    }
  } catch (err) {
    console.warn('[compressUploadedFile] Error during image compression:', err.message);
  }
  next();
};

module.exports = compressUploadedFile;

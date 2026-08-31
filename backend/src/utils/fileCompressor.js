const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

/**
 * Compress an image buffer or file using sharp.
 * Converts large MB images down to compact KB size (75% quality, max 1600px dimension).
 */
const compressImage = async (input, options = {}) => {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 75,
    format = 'jpeg'
  } = options;

  let pipeline = sharp(input).rotate(); // Auto-rotate based on EXIF

  const metadata = await pipeline.metadata();

  // Only resize if image dimensions exceed max limits
  if ((metadata.width && metadata.width > maxWidth) || (metadata.height && metadata.height > maxHeight)) {
    pipeline = pipeline.resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  if (format === 'webp') {
    pipeline = pipeline.webp({ quality });
  } else if (format === 'png') {
    pipeline = pipeline.png({ compressionLevel: 8, quality });
  } else {
    pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
  }

  return pipeline.toBuffer();
};

/**
 * Checks if a filename or mimetype is an image.
 */
const isImageFile = (mimetype = '', filename = '') => {
  const imageRegex = /\.(jpg|jpeg|png|webp|bmp|tiff|svg)$/i;
  const isImageMime = mimetype.startsWith('image/');
  return isImageMime || imageRegex.test(filename);
};

/**
 * Compress and save uploaded file to destination directory.
 * If file is an image, compresses it to ~50KB-150KB before writing to disk.
 */
const saveCompressedFile = async ({ buffer, originalname, mimetype, destinationDir, filenamePrefix = 'doc' }) => {
  if (!fs.existsSync(destinationDir)) {
    fs.mkdirSync(destinationDir, { recursive: true });
  }

  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  const ext = path.extname(originalname || '').toLowerCase();
  
  if (isImageFile(mimetype, originalname)) {
    const outputFilename = `${filenamePrefix}_${timestamp}_${random}.jpg`;
    const targetPath = path.join(destinationDir, outputFilename);

    try {
      const compressedBuffer = await compressImage(buffer, {
        maxWidth: 1600,
        maxHeight: 1600,
        quality: 75,
        format: 'jpeg'
      });

      fs.writeFileSync(targetPath, compressedBuffer);
      const originalKB = Math.round((buffer.length / 1024) * 10) / 10;
      const compressedKB = Math.round((compressedBuffer.length / 1024) * 10) / 10;

      console.log(`[fileCompressor] Image compressed: ${originalname} (${originalKB}KB ➔ ${compressedKB}KB)`);
      return {
        filename: outputFilename,
        path: targetPath,
        sizeKB: compressedKB,
        originalSizeKB: originalKB,
        mimeType: 'image/jpeg'
      };
    } catch (err) {
      console.warn(`[fileCompressor] Image compression failed, saving original: ${err.message}`);
      const fallbackFilename = `${filenamePrefix}_${timestamp}_${random}${ext || '.png'}`;
      const fallbackPath = path.join(destinationDir, fallbackFilename);
      fs.writeFileSync(fallbackPath, buffer);
      return {
        filename: fallbackFilename,
        path: fallbackPath,
        sizeKB: Math.round((buffer.length / 1024) * 10) / 10,
        mimeType: mimetype
      };
    }
  }

  // Non-image files (PDFs, Documents)
  const outputFilename = `${filenamePrefix}_${timestamp}_${random}${ext || '.pdf'}`;
  const targetPath = path.join(destinationDir, outputFilename);
  fs.writeFileSync(targetPath, buffer);
  
  const sizeKB = Math.round((buffer.length / 1024) * 10) / 10;
  console.log(`[fileCompressor] Document saved: ${outputFilename} (${sizeKB}KB)`);

  return {
    filename: outputFilename,
    path: targetPath,
    sizeKB,
    mimeType: mimetype
  };
};

/**
 * Compress an existing file on disk if it is an image.
 * Overwrites the disk file with a high-efficiency JPEG (75% quality, max 1600px).
 */
const compressDiskFileIfNeeded = async (filePath) => {
  if (!filePath || !fs.existsSync(filePath)) return;
  const ext = path.extname(filePath).toLowerCase();
  const isImage = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'].includes(ext);

  if (isImage) {
    try {
      const statBefore = fs.statSync(filePath);
      const originalKB = Math.round((statBefore.size / 1024) * 10) / 10;

      const buffer = fs.readFileSync(filePath);
      const compressedBuffer = await sharp(buffer)
        .rotate()
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75, progressive: true, mozjpeg: true })
        .toBuffer();

      fs.writeFileSync(filePath, compressedBuffer);
      const statAfter = fs.statSync(filePath);
      const compressedKB = Math.round((statAfter.size / 1024) * 10) / 10;
      console.log(`[fileCompressor] Compressed disk file ${path.basename(filePath)} (${originalKB}KB ➔ ${compressedKB}KB)`);
    } catch (err) {
      console.warn(`[fileCompressor] Failed to compress disk image ${filePath}: ${err.message}`);
    }
  }
};

module.exports = {
  compressImage,
  isImageFile,
  saveCompressedFile,
  compressDiskFileIfNeeded
};

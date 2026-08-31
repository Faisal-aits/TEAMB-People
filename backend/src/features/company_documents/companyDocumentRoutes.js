const express = require('express');
const router = express.Router();
const companyDocumentController = require('./companyDocumentController');
const { verifyToken, authorizeRoles } = require('../../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = path.join(__dirname, '..', 'uploads', 'documents');
    // Ensure directory exists
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

const compressUploadedFile = require('../../middleware/fileCompressor.middleware');

// All routes require authentication
router.use(verifyToken);

// Employee & Admin routes
router.get('/', companyDocumentController.getAllDocuments);

// Admin only routes
router.post('/', authorizeRoles('admin', 'hr'), upload.single('file'), compressUploadedFile, companyDocumentController.createDocument);
router.delete('/:id', authorizeRoles('admin', 'hr'), companyDocumentController.deleteDocument);

module.exports = router;

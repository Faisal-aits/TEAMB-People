// backend/src/features/documents/documentRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const requireModuleAccess = require('../../middleware/requireModuleAccess');
const documentController = require('./documentController');

const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `DOC-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage });

const compressUploadedFile = require('../../middleware/fileCompressor.middleware');

router.use(authMiddleware.verifyToken);

// Employee routes
router.get('/my', documentController.getMyDocuments);
router.get('/file/:filename', documentController.serveDocumentFile);
router.post('/upload-my-kyc', upload.single('file'), compressUploadedFile, documentController.uploadMyKYCDocument);

// Admin routes
router.get('/type/:type', requireModuleAccess('employee_management', 'read'), documentController.getAllByType);
router.get('/employee/:employeeId', requireModuleAccess('employee_management', 'read'), documentController.getForEmployee);
router.post('/upload', requireModuleAccess('employee_management', 'write'), upload.single('file'), documentController.uploadDocument);
router.put('/:id/send', requireModuleAccess('employee_management', 'write'), documentController.sendDocument);
router.delete('/:id', requireModuleAccess('employee_management', 'write'), documentController.deleteDocument);

module.exports = router;

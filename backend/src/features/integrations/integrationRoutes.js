const express = require('express');
const router = express.Router();
const multer = require('multer');
const integrationController = require('./integrationController');
const { verifyApiKey } = require('../../middleware/integrationAuth.middleware');
const { defaultRateLimiter } = require('../../middleware/rateLimiter.middleware');

// Multer config — mirrors the existing ticket upload settings
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WebP) or PDF documents are allowed'), false);
    }
  },
});

// All integration routes require a valid API Key + rate limiting
router.use(verifyApiKey);
router.use(defaultRateLimiter);

// POST /api/integration/tickets — Create a ticket from an external app
router.post('/tickets', upload.single('attachment'), integrationController.createTicket);

// GET /api/integration/tickets/status/:id — Lightweight status check
router.get('/tickets/status/:id', integrationController.getTicketStatus);

// GET /api/integration/tickets/:id — Full ticket details
router.get('/tickets/:id', integrationController.getTicket);

// POST /api/integration/tickets/:id/comments — Add a comment/update
router.post('/tickets/:id/comments', integrationController.addComment);

// POST /api/integration/tickets/:id/attachment — Upload / replace attachment
router.post('/tickets/:id/attachment', upload.single('attachment'), integrationController.uploadAttachment);

module.exports = router;

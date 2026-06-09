const express = require('express');
const router = express.Router();
const multer = require('multer');
const ticketController = require('./ticketController');
const { verifyToken } = require('../../middleware/auth.middleware');

// Configure multer — in-memory storage; files saved to disk in controller
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
  }
});

// All ticket routes require authentication
router.use(verifyToken);

// POST /api/tickets - Raise a ticket
router.post('/', upload.single('attachment'), ticketController.createTicket);

// GET /api/tickets - List tickets (scoped by user role and tenant)
router.get('/', ticketController.listTickets);

// GET /api/tickets/:id - Get detailed view of a ticket
router.get('/:id', ticketController.getTicketDetails);

// GET /api/tickets/:id/attachment - Get secure ticket attachment
router.get('/:id/attachment', ticketController.getAttachment);

// PUT /api/tickets/:id - Update ticket (priority, status, assignment)
router.put('/:id', ticketController.updateTicket);

// POST /api/tickets/:id/comments - Add a reply/comment to a ticket
router.post('/:id/comments', ticketController.addComment);

// GET /api/tickets/:id/comments - Get reply history for a ticket
router.get('/:id/comments', ticketController.getTicketComments);

module.exports = router;

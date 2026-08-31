const fs = require('fs');
const path = require('path');
const sendResponse = require('../../utils/response');
const ticketService = require('./ticketService');
const {
  ticketIdSchema,
  createTicketSchema,
  updateTicketSchema,
  createCommentSchema,
} = require('./ticketValidation');

const validate = (schema, payload) => {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });

  if (error) {
    const validationError = new Error(error.details.map((item) => item.message).join(', '));
    validationError.statusCode = 400;
    throw validationError;
  }

  return value;
};

const ticketController = {
  createTicket: async (req, res, next) => {
    try {
      const payload = validate(createTicketSchema, req.body);
      
      // Handle optional file attachment upload
      if (req.file) {
        const { saveCompressedFile } = require('../../utils/fileCompressor');
        const uploadDir = path.join(__dirname, '../../../uploads/ticket-attachments');
        const saved = await saveCompressedFile({
          buffer: req.file.buffer,
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          destinationDir: uploadDir,
          filenamePrefix: `ticket_${req.user.id}`
        });
        payload.attachment_url = `uploads/ticket-attachments/${saved.filename}`;
      }

      const ticketId = await ticketService.createTicket(req.tenantId, req.user.id, payload);
      return sendResponse(res, 201, true, 'Ticket raised successfully', { ticketId });
    } catch (error) {
      return next(error);
    }
  },

  getAttachment: async (req, res, next) => {
    try {
      const params = validate(ticketIdSchema, req.params);
      const ticket = await ticketService.getTicketDetails(req.tenantId, params.id, req.user);
      
      if (!ticket.attachment_url) {
        return res.status(404).json({ message: 'No attachment found for this ticket' });
      }

      const absolutePath = path.join(__dirname, '../../../', ticket.attachment_url);
      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: 'Attachment file not found on server' });
      }

      const ext = path.extname(absolutePath).toLowerCase();
      const mimeMap = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
      };
      
      res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="ticket_attachment_${params.id}${ext}"`);
      fs.createReadStream(absolutePath).pipe(res);
    } catch (error) {
      return next(error);
    }
  },

  listTickets: async (req, res, next) => {
    try {
      const filters = {
        project_id: req.query.project_id ? Number(req.query.project_id) : undefined,
        status: req.query.status || undefined,
        priority: req.query.priority || undefined,
        search: req.query.search || undefined,
      };
      
      const tickets = await ticketService.listTickets(req.tenantId, req.user, filters);
      return sendResponse(res, 200, true, 'Tickets retrieved successfully', tickets);
    } catch (error) {
      return next(error);
    }
  },

  getTicketDetails: async (req, res, next) => {
    try {
      const params = validate(ticketIdSchema, req.params);
      const ticket = await ticketService.getTicketDetails(req.tenantId, params.id, req.user);
      return sendResponse(res, 200, true, 'Ticket details retrieved successfully', ticket);
    } catch (error) {
      return next(error);
    }
  },

  updateTicket: async (req, res, next) => {
    try {
      const params = validate(ticketIdSchema, req.params);
      const payload = validate(updateTicketSchema, req.body);
      await ticketService.updateTicket(req.tenantId, params.id, req.user, payload);
      return sendResponse(res, 200, true, 'Ticket updated successfully', null);
    } catch (error) {
      return next(error);
    }
  },

  addComment: async (req, res, next) => {
    try {
      const params = validate(ticketIdSchema, req.params);
      const payload = validate(createCommentSchema, req.body);
      const commentId = await ticketService.addComment(req.tenantId, params.id, req.user, payload.comment);
      return sendResponse(res, 201, true, 'Comment added successfully', { commentId });
    } catch (error) {
      return next(error);
    }
  },

  getTicketComments: async (req, res, next) => {
    try {
      const params = validate(ticketIdSchema, req.params);
      const comments = await ticketService.getTicketComments(req.tenantId, params.id, req.user);
      return sendResponse(res, 200, true, 'Comments retrieved successfully', comments);
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = ticketController;

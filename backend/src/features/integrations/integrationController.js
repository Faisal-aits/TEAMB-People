const fs = require('fs');
const path = require('path');
const sendResponse = require('../../utils/response');
const ticketService = require('../tickets/ticketService');
const integrationModel = require('./integrationModel');
const { query } = require('../../config/db');
const {
  ticketIdSchema,
  createExternalTicketSchema,
  createCommentSchema,
} = require('../tickets/ticketValidation');

const validate = (schema, payload) => {
  const { error, value } = schema.validate(payload, { abortEarly: false, stripUnknown: true });
  if (error) {
    const validationError = new Error(error.details.map((d) => d.message).join(', '));
    validationError.statusCode = 400;
    throw validationError;
  }
  return value;
};

/**
 * Resolve which internal user should own this ticket.
 * Priority:
 *   1. raised_by_email in the payload — find matching user in the tenant
 *   2. Fall back to the first admin user of the tenant
 */
const resolveRaisedByUser = async (tenantId, email) => {
  if (email) {
    const rows = await query(
      'SELECT id FROM users WHERE email = ? AND tenant_id = ? LIMIT 1',
      [email, tenantId]
    );
    if (rows[0]) return rows[0].id;
  }

  // Default: first admin of the tenant
  const admins = await query(
    "SELECT id FROM users WHERE tenant_id = ? AND (position = 'admin' OR role = 'admin') ORDER BY id ASC LIMIT 1",
    [tenantId]
  );
  if (admins[0]) return admins[0].id;

  throw Object.assign(new Error('No valid user found in tenant to assign this ticket.'), { statusCode: 422 });
};

const integrationController = {
  // ─── POST /api/integration/tickets ─────────────────────────────────────────
  createTicket: async (req, res, next) => {
    let ticketId = null;
    try {
      const raw = { ...req.body };

      // Normalise: 'subject' is an alias for 'title'
      if (!raw.title && raw.subject) {
        raw.title = raw.subject;
      }

      const payload = validate(createExternalTicketSchema, raw);

      // Unify title/subject
      payload.title = payload.title || payload.subject;

      // Resolve source user
      const raisedByUserId = await resolveRaisedByUser(req.tenantId, payload.raised_by_email);

      // Handle optional attachment
      if (req.file) {
        const ext = path.extname(req.file.originalname).toLowerCase();
        const fileName = `ticket_ext_${Date.now()}${ext}`;
        const uploadDir = path.join(__dirname, '../../../uploads/ticket-attachments');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
        fs.writeFileSync(path.join(uploadDir, fileName), req.file.buffer);
        payload.attachment_url = `uploads/ticket-attachments/${fileName}`;
      }

      payload.api_key_id = req.integration.apiKeyId;

      ticketId = await ticketService.createTicket(req.tenantId, raisedByUserId, payload);

      // Audit log
      await integrationModel.logAudit({
        tenantId: req.tenantId,
        apiKeyId: req.integration.apiKeyId,
        action: 'CREATE_TICKET',
        ticketId,
        statusCode: 201,
        ipAddress: req.ip,
        details: { source_app: payload.source_app, external_ref: payload.external_ref || null },
      });

      return sendResponse(res, 201, true, 'Ticket created successfully', {
        ticketId,
        status: 'Open',
        source_app: payload.source_app,
        external_ref: payload.external_ref || null,
      });
    } catch (error) {
      // Audit failed attempts
      if (req.integration) {
        await integrationModel.logAudit({
          tenantId: req.tenantId,
          apiKeyId: req.integration.apiKeyId,
          action: 'CREATE_TICKET_FAILED',
          ticketId,
          statusCode: error.statusCode || 500,
          ipAddress: req.ip,
          details: { error: error.message },
        }).catch(() => {}); // never crash on audit failure
      }
      return next(error);
    }
  },

  // ─── GET /api/integration/tickets/:id ──────────────────────────────────────
  getTicket: async (req, res, next) => {
    try {
      const { id } = validate(ticketIdSchema, req.params);

      // Build a synthetic user object so ticketService.getTicketDetails works
      const integrationUser = { id: 0, position: 'admin', role: 'admin' };
      const ticket = await ticketService.getTicketDetails(req.tenantId, id, integrationUser);

      await integrationModel.logAudit({
        tenantId: req.tenantId,
        apiKeyId: req.integration.apiKeyId,
        action: 'GET_TICKET',
        ticketId: id,
        statusCode: 200,
        ipAddress: req.ip,
      });

      return sendResponse(res, 200, true, 'Ticket retrieved successfully', ticket);
    } catch (error) {
      return next(error);
    }
  },

  // ─── GET /api/integration/tickets/status/:id ───────────────────────────────
  getTicketStatus: async (req, res, next) => {
    try {
      const { id } = validate(ticketIdSchema, req.params);

      const rows = await query(
        'SELECT id, status, priority, source_app, external_ref, updated_at FROM tickets WHERE id = ? AND tenant_id = ? LIMIT 1',
        [id, req.tenantId]
      );
      const ticket = rows[0];
      if (!ticket) {
        return sendResponse(res, 404, false, 'Ticket not found', null);
      }

      await integrationModel.logAudit({
        tenantId: req.tenantId,
        apiKeyId: req.integration.apiKeyId,
        action: 'GET_TICKET_STATUS',
        ticketId: id,
        statusCode: 200,
        ipAddress: req.ip,
      });

      return sendResponse(res, 200, true, 'Ticket status retrieved', {
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        source_app: ticket.source_app,
        external_ref: ticket.external_ref,
        updated_at: ticket.updated_at,
      });
    } catch (error) {
      return next(error);
    }
  },

  // ─── POST /api/integration/tickets/:id/comments ────────────────────────────
  addComment: async (req, res, next) => {
    try {
      const { id } = validate(ticketIdSchema, req.params);
      const { comment } = validate(createCommentSchema, req.body);

      // Use tenant's first admin as the comment author for external calls
      const raisedByUserId = await resolveRaisedByUser(req.tenantId, null);
      const integrationUser = { id: raisedByUserId, position: 'admin', role: 'admin' };

      const commentId = await ticketService.addComment(req.tenantId, id, integrationUser, comment);

      await integrationModel.logAudit({
        tenantId: req.tenantId,
        apiKeyId: req.integration.apiKeyId,
        action: 'ADD_COMMENT',
        ticketId: id,
        statusCode: 201,
        ipAddress: req.ip,
      });

      return sendResponse(res, 201, true, 'Comment added successfully', { commentId });
    } catch (error) {
      return next(error);
    }
  },

  // ─── POST /api/integration/tickets/:id/attachment ──────────────────────────
  uploadAttachment: async (req, res, next) => {
    try {
      const { id } = validate(ticketIdSchema, req.params);

      if (!req.file) {
        return sendResponse(res, 400, false, 'No file uploaded. Provide a file in the "attachment" field.', null);
      }

      const rows = await query(
        'SELECT id FROM tickets WHERE id = ? AND tenant_id = ? LIMIT 1',
        [id, req.tenantId]
      );
      if (!rows[0]) {
        return sendResponse(res, 404, false, 'Ticket not found', null);
      }

      const ext = path.extname(req.file.originalname).toLowerCase();
      const fileName = `ticket_ext_${id}_${Date.now()}${ext}`;
      const uploadDir = path.join(__dirname, '../../../uploads/ticket-attachments');
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
      fs.writeFileSync(path.join(uploadDir, fileName), req.file.buffer);
      const attachmentUrl = `uploads/ticket-attachments/${fileName}`;

      await query(
        'UPDATE tickets SET attachment_url = ? WHERE id = ? AND tenant_id = ?',
        [attachmentUrl, id, req.tenantId]
      );

      await integrationModel.logAudit({
        tenantId: req.tenantId,
        apiKeyId: req.integration.apiKeyId,
        action: 'UPLOAD_ATTACHMENT',
        ticketId: id,
        statusCode: 200,
        ipAddress: req.ip,
        details: { file: fileName },
      });

      return sendResponse(res, 200, true, 'Attachment uploaded successfully', { attachmentUrl });
    } catch (error) {
      return next(error);
    }
  },
};

module.exports = integrationController;

const Joi = require('joi');

const ticketIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createTicketSchema = Joi.object({
  title: Joi.string().trim().min(3).max(150).required(),
  description: Joi.string().trim().min(5).required(),
  project_id: Joi.number().integer().positive().optional().allow(null),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').default('Medium'),
  // Integration fields — optional for browser-based requests
  source_app: Joi.string().trim().max(100).optional().allow(null, ''),
  external_ref: Joi.string().trim().max(100).optional().allow(null, ''),
}).options({ stripUnknown: true });

/**
 * Validation schema for tickets raised via the external integration API.
 * Supports both 'title' (direct) or 'subject' (SDK alias).
 */
const createExternalTicketSchema = Joi.object({
  // Accept 'title' or 'subject' as the ticket heading
  title: Joi.string().trim().min(3).max(150).optional(),
  subject: Joi.string().trim().min(3).max(150).optional(),
  description: Joi.string().trim().min(5).required(),
  project_id: Joi.number().integer().positive().optional().allow(null),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').default('Medium'),
  source_app: Joi.string().trim().max(100).required(),
  external_ref: Joi.string().trim().max(100).optional().allow(null, ''),
  // Optional: allow caller to specify the employee raising this ticket by email
  raised_by_email: Joi.string().email().trim().optional().allow(null, ''),
  raised_by_name: Joi.string().trim().max(150).optional().allow(null, ''),
})
  .or('title', 'subject')
  .options({ stripUnknown: true });

const updateTicketSchema = Joi.object({
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').optional(),
  status: Joi.string().valid('Open', 'In Progress', 'Resolved', 'Closed').optional(),
  assigned_to_user_id: Joi.number().integer().positive().optional().allow(null),
}).min(1).options({ stripUnknown: true });

const createCommentSchema = Joi.object({
  comment: Joi.string().trim().min(1).required(),
}).options({ stripUnknown: true });

module.exports = {
  ticketIdSchema,
  createTicketSchema,
  createExternalTicketSchema,
  updateTicketSchema,
  createCommentSchema,
};


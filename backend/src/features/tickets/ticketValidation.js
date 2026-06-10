const Joi = require('joi');

const ticketIdSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const createTicketSchema = Joi.object({
  title: Joi.string().trim().min(3).max(50).required(),
  description: Joi.string().trim().min(5).required(),
  project_id: Joi.number().integer().positive().optional().allow(null),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Urgent').default('Medium'),
}).options({ stripUnknown: true });

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
  updateTicketSchema,
  createCommentSchema,
};

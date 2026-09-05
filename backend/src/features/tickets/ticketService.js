const ticketModel = require('./ticketModel');

const ticketService = {
  createTicket: async (tenantId, raisedByUserId, data) => {
    const ticketId = await ticketModel.create(tenantId, raisedByUserId, data);
    await Notification.notifyAdmins(tenantId, 'ticket', 'New Ticket Raised', `A new ticket '${data.subject}' has been raised.`, ticketId);
    return ticketId;
  },

  listTickets: async (tenantId, user, filters = {}) => {
    // Enforcement: regular employees/HR can only see their own tickets
    // unless they have admin permissions.
    if (user.position !== 'admin') {
      filters.raised_by_user_id = user.id;
    }
    return await ticketModel.getAll(tenantId, filters);
  },

  getTicketDetails: async (tenantId, id, user) => {
    const ticket = await ticketModel.getById(tenantId, id);
    if (!ticket) {
      const error = new Error('Ticket not found');
      error.statusCode = 404;
      throw error;
    }

    // Enforcement: regular users can only view their own tickets
    if (user.position !== 'admin' && ticket.raised_by_user_id !== user.id) {
      const error = new Error('Access denied to this ticket');
      error.statusCode = 403;
      throw error;
    }

    return ticket;
  },

  updateTicketStatus: async (tenantId, id, status, updatedByUserId) => {
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      const error = new Error('Invalid status value');
      error.statusCode = 400;
      throw error;
    }
    const result = await ticketModel.updateStatus(tenantId, id, status, updatedByUserId);
    const ticket = await ticketModel.getById(tenantId, id);
    await Notification.create(tenantId, ticket.raised_by_user_id, 'ticket', 'Ticket Status Updated', `Your ticket '${ticket.subject}' is now ${status}.`, id);
    return result;
  },

  updateTicket: async (tenantId, id, user, data) => {
    const ticket = await ticketModel.getById(tenantId, id);
    if (!ticket) {
      const error = new Error('Ticket not found');
      error.statusCode = 404;
      throw error;
    }

    // Enforcement: regular users can only close their own tickets,
    // they cannot assign or change priority.
    if (user.position !== 'admin') {
      if (ticket.raised_by_user_id !== user.id) {
        const error = new Error('Access denied to modify this ticket');
        error.statusCode = 403;
        throw error;
      }
      
      // If a regular user updates, they can only update status to 'Closed'
      if (data.priority || data.assigned_to_user_id !== undefined || (data.status && data.status !== 'Closed')) {
        const error = new Error('Only administrators can reassign tickets or change priority');
        error.statusCode = 403;
        throw error;
      }
    }

    return await ticketModel.update(tenantId, id, data);
  },

  addComment: async (tenantId, ticketId, user, comment) => {
    const ticket = await ticketModel.getById(tenantId, ticketId);
    if (!ticket) {
      const error = new Error('Ticket not found');
      error.statusCode = 404;
      throw error;
    }

    // Enforcement: regular users can only comment on their own tickets
    if (user.position !== 'admin' && ticket.raised_by_user_id !== user.id) {
      const error = new Error('Access denied to post comments on this ticket');
      error.statusCode = 403;
      throw error;
    }

    return await ticketModel.addComment(tenantId, ticketId, user.id, comment);
  },

  getTicketComments: async (tenantId, ticketId, user) => {
    const ticket = await ticketModel.getById(tenantId, ticketId);
    if (!ticket) {
      const error = new Error('Ticket not found');
      error.statusCode = 404;
      throw error;
    }

    // Enforcement: regular users can only see comments of their own tickets
    if (user.position !== 'admin' && ticket.raised_by_user_id !== user.id) {
      const error = new Error('Access denied to view comments for this ticket');
      error.statusCode = 403;
      throw error;
    }

    return await ticketModel.getComments(tenantId, ticketId);
  },
};

module.exports = ticketService;

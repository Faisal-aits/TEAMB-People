const fs = require('fs');
let text = fs.readFileSync('backend/src/features/tickets/ticketService.js', 'utf8');
text = text.replace(
  'return await ticketModel.create(tenantId, raisedByUserId, data);',
  'const ticketId = await ticketModel.create(tenantId, raisedByUserId, data);\n    await Notification.notifyAdmins(tenantId, \'ticket\', \'New Ticket Raised\', \A new ticket \'\\' has been raised.\, ticketId);\n    return ticketId;'
);
fs.writeFileSync('backend/src/features/tickets/ticketService.js', text);

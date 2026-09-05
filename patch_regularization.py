import sys

with open('backend/src/features/attendance/regularizationController.js', 'r') as f:
    content = f.read()

# Add imports
if 'const Notification = require(' not in content:
    content = content.replace("const Regularization = require('./regularizationModel');", "const Regularization = require('./regularizationModel');\nconst Notification = require('../notifications/notificationModel');")


# Patch approve
target_approve = '''      const updated = await Regularization.approveRequest(
        req.tenantId,
        parseInt(id),
        reviewedBy,
        admin_remarks
      );

      res.json({ success: true, message: 'Request approved and attendance updated', request: updated });'''

replacement_approve = '''      const updated = await Regularization.approveRequest(
        req.tenantId,
        parseInt(id),
        reviewedBy,
        admin_remarks
      );
      
      const [[reqUser]] = await pool.execute(SELECT u.id as user_id FROM tb_regularizations r JOIN employee_details ed ON ed.id = r.employee_id JOIN users u ON u.id = ed.employee_id WHERE r.id = ? AND r.tenant_id = ?, [parseInt(id), req.tenantId]);
      if (reqUser && reqUser.user_id) {
          await Notification.create(req.tenantId, reqUser.user_id, 'attendance', 'Attendance Correction Approved', Your attendance correction request for  was approved., parseInt(id));
      }

      res.json({ success: true, message: 'Request approved and attendance updated', request: updated });'''

if target_approve in content:
    content = content.replace(target_approve, replacement_approve)


# Patch reject
target_reject = '''      const updated = await Regularization.rejectRequest(
        req.tenantId,
        parseInt(id),
        reviewedBy,
        admin_remarks
      );

      res.json({ success: true, message: 'Request rejected', request: updated });'''

replacement_reject = '''      const updated = await Regularization.rejectRequest(
        req.tenantId,
        parseInt(id),
        reviewedBy,
        admin_remarks
      );

      const [[reqUser]] = await pool.execute(SELECT u.id as user_id FROM tb_regularizations r JOIN employee_details ed ON ed.id = r.employee_id JOIN users u ON u.id = ed.employee_id WHERE r.id = ? AND r.tenant_id = ?, [parseInt(id), req.tenantId]);
      if (reqUser && reqUser.user_id) {
          await Notification.create(req.tenantId, reqUser.user_id, 'attendance', 'Attendance Correction Rejected', Your attendance correction request for  was rejected., parseInt(id));
      }

      res.json({ success: true, message: 'Request rejected', request: updated });'''

if target_reject in content:
    content = content.replace(target_reject, replacement_reject)

# Patch create
target_create = '''      const newRequest = await Regularization.createRequest(req.tenantId, {
        employee_id: employeeId,
        attendance_id,
        request_date,
        requested_check_in: requested_check_in || null,
        requested_check_out: requested_check_out || null,
        requested_status: requested_status || null,
        reason,
      });

      res.status(201).json({'''

replacement_create = '''      const newRequest = await Regularization.createRequest(req.tenantId, {
        employee_id: employeeId,
        attendance_id,
        request_date,
        requested_check_in: requested_check_in || null,
        requested_check_out: requested_check_out || null,
        requested_status: requested_status || null,
        reason,
      });

      await Notification.notifyAdmins(req.tenantId, 'attendance', 'New Attendance Correction', A new attendance correction was requested for ., newRequest.id);

      res.status(201).json({'''

if target_create in content:
    content = content.replace(target_create, replacement_create)


with open('backend/src/features/attendance/regularizationController.js', 'w') as f:
    f.write(content)
print("Patched regularization successfully!")

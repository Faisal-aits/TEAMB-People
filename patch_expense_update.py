import sys

with open('backend/src/features/expense/expenseController.js', 'r') as f:
    content = f.read()

target = '''            const affectedRows = await Expense.updateStatus(req.tenantId, expenseId, status, req.user.id);

            if (affectedRows === 0) {'''

replacement = '''            const affectedRows = await Expense.updateStatus(req.tenantId, expenseId, status, req.user.id);
            const expense = await Expense.getById(req.tenantId, expenseId);
            if (expense) {
                await Notification.create(req.tenantId, expense.employee_id, 'reimbursement', 'Reimbursement Status Updated', Your reimbursement request is now ., expenseId);
            }

            if (affectedRows === 0) {'''

if target in content:
    content = content.replace(target, replacement)
    with open('backend/src/features/expense/expenseController.js', 'w') as f:
        f.write(content)
    print("Patched update successfully!")
else:
    print("Target not found!")

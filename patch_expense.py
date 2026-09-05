import sys

with open('backend/src/features/expense/expenseController.js', 'r') as f:
    content = f.read()

target = '''            const expenseId = await Expense.create(req.tenantId, {
                employee_id: req.user.id,
                category_id: parseInt(category_id),
                amount: amountNum,
                description: description,
                image: imagePath
            });

            res.status(201).json({'''

replacement = '''            const expenseId = await Expense.create(req.tenantId, {
                employee_id: req.user.id,
                category_id: parseInt(category_id),
                amount: amountNum,
                description: description,
                image: imagePath
            });
            await Notification.notifyAdmins(req.tenantId, 'reimbursement', 'New Reimbursement', A new reimbursement for amount  has been submitted., expenseId);

            res.status(201).json({'''

if target in content:
    content = content.replace(target, replacement)
    with open('backend/src/features/expense/expenseController.js', 'w') as f:
        f.write(content)
    print("Patched create successfully!")
else:
    print("Target not found!")

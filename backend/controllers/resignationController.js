// controllers/resignationController.js
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const tenantId = req.tenantId;
        const uploadDir = path.join(__dirname, '..', 'uploads', 'branding', String(tenantId), 'letters', 'resignation');
        
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const resignationId = req.params.id;
        cb(null, `${resignationId}.pdf`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed'), false);
        }
    }
});

const resignationController = {
    submitRequest: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const { requested_last_day, reason, additional_note } = req.body;

            if (!requested_last_day || !reason) {
                return res.status(400).json({ success: false, message: 'Last working day and reason are required' });
            }

            // Get the string-based employee ID (e.g., AITS001) for this user
            const [empRows] = await pool.execute(
                'SELECT id FROM employee_details WHERE user_id = ? AND tenant_id = ?',
                [req.user.id, tenantId]
            );
            
            if (!empRows || empRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Employee details not found' });
            }
            const employeeId = empRows[0].id;

            // Check if there's already a pending or accepted request
            const [existing] = await pool.execute(
                'SELECT id FROM resignation_requests WHERE tenant_id = ? AND employee_id = ? AND status IN ("pending", "accepted")',
                [tenantId, employeeId]
            );

            if (existing && existing.length > 0) {
                return res.status(400).json({ success: false, message: 'You already have an active resignation request.' });
            }

            // Generate Ref Number: RES-{year}-{seq}
            const year = new Date().getFullYear();
            const [countRows] = await pool.execute(
                'SELECT COUNT(*) as cnt FROM resignation_requests WHERE tenant_id = ? AND YEAR(created_at) = ?',
                [tenantId, year]
            );
            const seq = (countRows[0].cnt + 1).toString().padStart(4, '0');
            const ref_number = `RES-${year}-${seq}`;

            await pool.execute(
                `INSERT INTO resignation_requests 
                (tenant_id, employee_id, requested_last_day, reason, additional_note, status, ref_number) 
                VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
                [tenantId, employeeId, requested_last_day, reason, additional_note || null, ref_number]
            );

            res.status(201).json({ success: true, message: 'Resignation request submitted successfully.' });
        } catch (error) {
            console.error('Submit resignation error:', error);
            res.status(500).json({ success: false, message: 'Failed to submit resignation request' });
        }
    },

    // GET /api/resignation-requests/my
    getMyRequests: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const userId = req.user.id;
            const [requests] = await pool.execute(
                `SELECT r.* FROM resignation_requests r
                 JOIN employee_details ed ON r.employee_id = ed.id
                 WHERE r.tenant_id = ? AND ed.user_id = ? 
                 ORDER BY r.created_at DESC`,
                [tenantId, userId]
            );

            res.json({ success: true, data: requests });
        } catch (error) {
            console.error('Get my requests error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch your requests' });
        }
    },

    // GET /api/resignation-requests
    getAllRequests: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            
            const [requests] = await pool.execute(
                `SELECT r.*, u.first_name, u.last_name, d.name as department, ed.position as designation 
                 FROM resignation_requests r
                 JOIN employee_details ed ON r.employee_id = ed.id
                 JOIN users u ON ed.user_id = u.id
                 LEFT JOIN departments d ON ed.department_id = d.id
                 WHERE r.tenant_id = ? 
                 ORDER BY r.created_at DESC`,
                [tenantId]
            );

            res.json({ success: true, data: requests });
        } catch (error) {
            console.error('Get all requests error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch requests' });
        }
    },

    // GET /api/resignation-requests/:id
    getRequestById: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const { id } = req.params;

            const [requests] = await pool.execute(
                `SELECT r.*, u.first_name, u.last_name, u.email, ed.joining_date, d.name as department, ed.position as designation 
                 FROM resignation_requests r
                 JOIN employee_details ed ON r.employee_id = ed.id
                 JOIN users u ON ed.user_id = u.id
                 LEFT JOIN departments d ON ed.department_id = d.id
                 WHERE r.id = ? AND r.tenant_id = ?`,
                [id, tenantId]
            );

            if (requests.length === 0) {
                return res.status(404).json({ success: false, message: 'Request not found' });
            }

            res.json({ success: true, data: requests[0] });
        } catch (error) {
            console.error('Get request error:', error);
            res.status(500).json({ success: false, message: 'Failed to fetch request details' });
        }
    },

    // PUT /api/resignation-requests/:id/accept
    acceptRequest: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const { accepted_last_day, hr_note } = req.body;

            console.log('ACCEPT DEBUG:', { id, tenantId, accepted_last_day, hasFile: !!req.file });

            if (!req.file) {
                return res.status(400).json({ success: false, message: 'PDF document is required' });
            }

            const letter_url = `/uploads/branding/${tenantId}/letters/resignation/${req.file.filename}`;

            const [result] = await pool.execute(
                `UPDATE resignation_requests 
                 SET status = 'accepted', accepted_last_day = ?, hr_note = ?, letter_url = ?, letter_generated_at = NOW() 
                 WHERE id = ? AND tenant_id = ? AND status = 'pending'`,
                [accepted_last_day || null, hr_note || null, letter_url, id, tenantId]
            );

            console.log('SQL UPDATE RESULT:', result);

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Request not found or not in pending state' });
            }

            res.json({ success: true, message: 'Resignation accepted and letter generated.', letter_url });
        } catch (error) {
            console.error('ACCEPT ERROR:', error);
            res.status(500).json({ success: false, message: 'Failed to accept request: ' + error.message });
        }
    },

    // PUT /api/resignation-requests/:id/reject
    rejectRequest: async (req, res) => {
        try {
            const tenantId = req.tenantId;
            const { id } = req.params;
            const { rejection_reason } = req.body;

            if (!rejection_reason) {
                return res.status(400).json({ success: false, message: 'Rejection reason is required' });
            }

            const [result] = await pool.execute(
                `UPDATE resignation_requests 
                 SET status = 'rejected', rejection_reason = ? 
                 WHERE id = ? AND tenant_id = ? AND status = 'pending'`,
                [rejection_reason, id, tenantId]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Request not found or not in pending state' });
            }

            res.json({ success: true, message: 'Resignation rejected.' });
        } catch (error) {
            console.error('Reject request error:', error);
            res.status(500).json({ success: false, message: 'Failed to reject request' });
        }
    },

    uploadPDFMiddleware: upload.single('pdf')
};

module.exports = resignationController;

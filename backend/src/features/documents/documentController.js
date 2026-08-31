// backend/src/features/documents/documentController.js
const fs = require('fs');
const Document = require('./documentModel');
const Notification = require('../notifications/notificationModel');

const documentController = {
  // Get all documents for a specific employee (Admin only)
  getForEmployee: async (req, res) => {
    try {
      const documents = await Document.getForEmployee(req.tenantId, req.params.employeeId, false);
      res.json({ success: true, documents });
    } catch (error) {
      console.error('Get employee documents error:', error);
      res.status(500).json({ message: 'Failed to get documents' });
    }
  },

  getAllByType: async (req, res) => {
    try {
      const { type } = req.params;
      const documents = await Document.getAllByType(req.tenantId, type);
      res.json({ success: true, documents });
    } catch (error) {
      console.error('Get all documents by type error:', error);
      res.status(500).json({ message: 'Failed to get documents' });
    }
  },

  // Get documents for the logged-in employee
  getMyDocuments: async (req, res) => {
    try {
      const { pool } = require('../../config/db');
      const [empRows] = await pool.execute(
        'SELECT id, employee_id FROM employee_details WHERE (employee_id = ? OR id = ?) AND tenant_id = ?',
        [req.user.id, req.user.id, req.tenantId]
      );
      
      if (empRows.length === 0) {
          return res.status(404).json({ message: 'Employee profile not found' });
      }
      const empId = empRows[0].id;

      const documents = await Document.getForEmployee(req.tenantId, empId, false);
      res.json({ success: true, documents });
    } catch (error) {
      console.error('Get my documents error:', error);
      res.status(500).json({ message: 'Failed to get your documents' });
    }
  },

  // Admin marks a document as sent (visible to employee)
  sendDocument: async (req, res) => {
    try {
      const doc = await Document.getById(req.tenantId, req.params.id);
      if (!doc) {
        return res.status(404).json({ message: 'Document not found' });
      }

      const success = await Document.send(req.tenantId, req.params.id);
      if (success) {
        // Find the user_id for this employee_id
        const { pool } = require('../../config/db');
        const [empRows] = await pool.execute('SELECT employee_id FROM employee_details WHERE id = ? AND tenant_id = ?', [doc.employee_id, req.tenantId]);
        
        if (empRows.length > 0) {
          const userId = empRows[0].employee_id;
          let title = 'New Document Available';
          let message = `A new document "${doc.title}" has been added to your profile.`;
          
          if (doc.document_type === 'increment_letter') {
             title = 'Increment Letter Available';
             message = 'Your new increment letter is now available in My Documents.';
          } else if (doc.document_type === 'salary_slip') {
             title = 'Salary Slip Available';
             message = `Your salary slip for ${doc.title} is now available in My Documents.`;
          }

          await Notification.create(req.tenantId, userId, 'document', title, message, doc.id);
        }

        res.json({ success: true, message: 'Document sent to employee successfully' });
      } else {
        res.status(400).json({ message: 'Failed to send document' });
      }
    } catch (error) {
      console.error('Send document error:', error);
      res.status(500).json({ message: 'Failed to send document' });
    }
  },

  deleteDocument: async (req, res) => {
    try {
      await Document.deleteById(req.tenantId, req.params.id);
      res.json({ success: true, message: 'Document deleted successfully' });
    } catch (error) {
      console.error('Delete document error:', error);
      res.status(500).json({ message: 'Failed to delete document' });
    }
  },

  uploadDocument: async (req, res) => {
    try {
      const { employee_id, document_type, title, metadata } = req.body;
      const tenantId = req.tenantId;

      if (!employee_id || !document_type || !title || !req.file) {
        return res.status(400).json({ success: false, message: 'Missing required fields or document file' });
      }

      const { pool } = require('../../config/db');
      const [empCheck] = await pool.execute(
        'SELECT id FROM employee_details WHERE id = ? AND tenant_id = ?',
        [employee_id, tenantId]
      );
      if (empCheck.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee not found in the current organization' });
      }

      // Check if document of this type already exists for employee
      if (document_type !== 'salary_slip' && document_type !== 'other') {
        const existingDocs = await Document.getForEmployee(tenantId, employee_id, false);
        const duplicate = existingDocs.find(d => d.document_type.toLowerCase() === document_type.toLowerCase());
        if (duplicate) {
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
          }
          const docTypeFormatted = document_type.replace(/_/g, ' ').toUpperCase();
          return res.status(400).json({
            success: false,
            message: `${docTypeFormatted} document already exists for this employee. Please delete the existing document first.`
          });
        }
      }

      const documentUrl = `/uploads/documents/${req.file.filename}`;
      let parsedMetadata = null;
      try {
        if (metadata) parsedMetadata = JSON.parse(metadata);
      } catch (e) {
        console.warn("Failed to parse metadata", metadata);
      }

      // Save to employee_documents table. We mark it is_sent = 1 so employee can see it immediately.
      const docId = await Document.save(
        tenantId,
        employee_id,
        document_type,
        title,
        documentUrl,
        parsedMetadata,
        1 
      );

      // Find user_id to send notification
      const [empRows] = await pool.execute('SELECT employee_id FROM employee_details WHERE id = ? AND tenant_id = ?', [employee_id, tenantId]);
      
      if (empRows.length > 0) {
        const userId = empRows[0].employee_id;
        let notifTitle = 'New Document Available';
        let message = `A new document "${title}" has been added to your profile.`;
        
        if (document_type === 'salary_slip') {
           notifTitle = 'Salary Slip Available';
           message = `Your salary slip for ${title} is now available in My Documents.`;
        }
        await Notification.create(tenantId, userId, 'document', notifTitle, message, docId);
      }

      res.status(201).json({ success: true, message: 'Document saved and sent to employee successfully', documentUrl });
    } catch (error) {
      console.error('Upload document error:', error);
      res.status(500).json({ success: false, message: 'Failed to upload document' });
    }
  },

  uploadMyKYCDocument: async (req, res) => {
    try {
      const tenantId = req.tenantId;
      const { document_type, title } = req.body;

      if (!document_type || !title || !req.file) {
        return res.status(400).json({ success: false, message: 'Missing document type, title, or file' });
      }

      const { pool } = require('../../config/db');

      // Fail-safe: ensure document_type column supports any string type
      try {
        await pool.execute(`ALTER TABLE employee_documents MODIFY COLUMN document_type VARCHAR(100) NOT NULL`);
      } catch (e) {}

      const [empRows] = await pool.execute(
        'SELECT id FROM employee_details WHERE employee_id = ? AND tenant_id = ?',
        [req.user.id, tenantId]
      );

      if (empRows.length === 0) {
        return res.status(404).json({ success: false, message: 'Employee profile not found' });
      }

      const empId = empRows[0].id;

      // Check if document of this type already exists for employee
      if (document_type !== 'other') {
        const existingDocs = await Document.getForEmployee(tenantId, empId, false);
        const duplicate = existingDocs.find(d => d.document_type.toLowerCase() === document_type.toLowerCase());
        if (duplicate) {
          if (req.file && req.file.path && fs.existsSync(req.file.path)) {
            try { fs.unlinkSync(req.file.path); } catch (e) {}
          }
          const docTypeFormatted = document_type.replace(/_/g, ' ').toUpperCase();
          return res.status(400).json({
            success: false,
            message: `${docTypeFormatted} document already exists. Please delete the existing document first.`
          });
        }
      }

      const documentUrl = `/uploads/documents/${req.file.filename}`;

      const docId = await Document.save(
        tenantId,
        empId,
        document_type || 'kyc_document',
        title,
        documentUrl,
        { uploaded_by: 'employee' },
        1
      );

      res.status(201).json({
        success: true,
        message: 'KYC Document uploaded successfully',
        document: {
          id: docId,
          document_type: document_type || 'kyc_document',
          title,
          file_url: documentUrl,
          created_at: new Date()
        }
      });
    } catch (error) {
      console.error('Upload my KYC document error:', error);
      res.status(500).json({ success: false, message: 'Failed to upload KYC document' });
    }
  },

  serveDocumentFile: async (req, res) => {
    try {
      const filename = path.basename(req.params.filename);
      const tenantId = req.tenantId;

      const { pool } = require('../../config/db');
      const [docs] = await pool.execute(
        `SELECT ed.employee_id AS owner_user_id, d.file_url, d.tenant_id
         FROM employee_documents d
         LEFT JOIN employee_details ed ON ed.id = d.employee_id AND ed.tenant_id = d.tenant_id
         WHERE (d.file_url LIKE ? OR d.file_url LIKE ?) AND d.tenant_id = ?
         LIMIT 1`,
        [`%/${filename}`, `%\\${filename}`, tenantId]
      );

      if (docs.length === 0) {
        return res.status(404).json({ success: false, message: 'Document not found' });
      }

      const doc = docs[0];
      const userRole = (req.user?.role || req.user?.position || '').toLowerCase();
      const isAdminOrHr = userRole === 'admin' || userRole === 'hr';
      const isOwner = Number(doc.owner_user_id) === Number(req.user?.id);

      if (!isAdminOrHr && !isOwner) {
        return res.status(403).json({ success: false, message: 'Access denied to this document' });
      }

      const uploadsDir = process.env.UPLOADS_DIR || path.join(__dirname, '..', '..', '..', 'uploads');
      const filePath = path.join(uploadsDir, 'documents', filename);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'Physical file not found on server storage' });
      }

      return res.sendFile(filePath);
    } catch (error) {
      console.error('Serve document file error:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve document file' });
    }
  }
};

module.exports = documentController;

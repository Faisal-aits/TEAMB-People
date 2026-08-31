// backend/src/features/documents/documentModel.js
const { pool } = require('../../config/db');

const Document = {
  save: async (tenantId, employeeId, type, title, fileUrl, metadata = {}, isSent = 0) => {
    const [result] = await pool.execute(
      `INSERT INTO employee_documents (tenant_id, employee_id, document_type, title, file_url, is_sent, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [tenantId, employeeId, type, title, fileUrl, isSent, JSON.stringify(metadata)]
    );
    return result.insertId;
  },

  getAllByType: async (tenantId, type) => {
    const [rows] = await pool.execute(
      `SELECT ed.*, u.first_name, u.last_name, emp.position 
       FROM employee_documents ed
       JOIN employee_details emp ON ed.employee_id = emp.id
       JOIN users u ON emp.employee_id = u.id
       WHERE ed.tenant_id = ? AND ed.document_type = ?
       ORDER BY ed.generated_at DESC`,
      [tenantId, type]
    );
    return rows.map(r => ({
      ...r,
      metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : {}
    }));
  },

  getForEmployee: async (tenantId, employeeId, onlySent = false) => {
    try {
      const [empDetails] = await pool.execute(
        `SELECT ed.id as detail_id, ed.employee_id as user_fk
         FROM employee_details ed
         WHERE ed.id = ? OR ed.employee_id = ?`,
        [employeeId, employeeId]
      );

      let idList = [String(employeeId)];
      if (empDetails.length > 0) {
        empDetails.forEach(e => {
          if (e.detail_id) idList.push(String(e.detail_id));
          if (e.user_fk) idList.push(String(e.user_fk));
        });
        idList = Array.from(new Set(idList.filter(Boolean)));
      }

      const placeholders = idList.map(() => '?').join(',');
      let sql = `
        SELECT id, document_type, title, file_url, is_sent, metadata, generated_at
        FROM employee_documents
        WHERE employee_id IN (${placeholders})
      `;
      if (onlySent) sql += ' AND is_sent = 1';
      sql += ' ORDER BY generated_at DESC';

      const [rows] = await pool.execute(sql, idList);
      return rows.map(r => ({
        ...r,
        metadata: r.metadata ? (typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata) : {}
      }));
    } catch (err) {
      console.error('Error in getForEmployee:', err);
      return [];
    }
  },

  // Get documents for the logged-in employee (only sent ones)
  getMyDocuments: async (tenantId, employeeId) => {
    return Document.getForEmployee(tenantId, employeeId, true);
  },

  // Admin sends document to employee (makes it visible to employee)
  send: async (tenantId, documentId) => {
    const [result] = await pool.execute(
      `UPDATE employee_documents SET is_sent = 1 WHERE id = ? AND tenant_id = ?`,
      [documentId, tenantId]
    );
    return result.affectedRows > 0;
  },

  deleteById: async (tenantId, documentId) => {
    const fs = require('fs');
    const path = require('path');

    // 1. Find file_url of document to delete from disk
    const [rows] = await pool.execute(
      `SELECT file_url FROM employee_documents WHERE id = ? AND tenant_id = ?`,
      [documentId, tenantId]
    );

    if (rows.length > 0 && rows[0].file_url) {
      const fileUrl = rows[0].file_url;
      const filename = path.basename(fileUrl);
      
      const possiblePaths = [
        path.join(__dirname, '..', '..', '..', 'uploads', 'documents', filename),
        path.join(process.cwd(), 'uploads', 'documents', filename),
        path.join(process.cwd(), fileUrl.startsWith('/') ? fileUrl.slice(1) : fileUrl)
      ];

      for (const p of possiblePaths) {
        try {
          if (fs.existsSync(p)) {
            fs.unlinkSync(p);
            console.log('Successfully unlinked document file from disk:', p);
            break;
          }
        } catch (err) {
          console.error('Failed to unlink document file from disk:', p, err);
        }
      }
    }

    // 2. Delete record from MySQL DB
    await pool.execute(
      `DELETE FROM employee_documents WHERE id = ? AND tenant_id = ?`,
      [documentId, tenantId]
    );
  },

  getById: async (tenantId, documentId) => {
    const [rows] = await pool.execute(
      `SELECT * FROM employee_documents WHERE id = ? AND tenant_id = ?`,
      [documentId, tenantId]
    );
    return rows[0] || null;
  }
};

module.exports = Document;

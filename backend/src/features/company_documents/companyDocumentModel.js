const { pool } = require('../../config/db');

class CompanyDocumentModel {
  static async create(data) {
    const { tenant_id, title, description, type, file_url, link_url, category, uploaded_by } = data;
    
    const query = `
      INSERT INTO tb_company_documents 
      (tenant_id, title, description, type, file_url, link_url, category, uploaded_by) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      tenant_id, 
      title, 
      description || null, 
      type, 
      file_url || null, 
      link_url || null, 
      category || null, 
      uploaded_by
    ];

    const [result] = await pool.execute(query, values);
    return result.insertId;
  }

  static async getAll(tenantId) {
    const query = `
      SELECT d.*, u.first_name, u.last_name 
      FROM tb_company_documents d
      LEFT JOIN users u ON d.uploaded_by = u.id
      WHERE d.tenant_id = ?
      ORDER BY d.created_at DESC
    `;
    const [rows] = await pool.execute(query, [tenantId]);
    return rows;
  }

  static async getById(id, tenantId) {
    const query = `
      SELECT * FROM tb_company_documents 
      WHERE id = ? AND tenant_id = ?
    `;
    const [rows] = await pool.execute(query, [id, tenantId]);
    return rows[0];
  }

  static async delete(id, tenantId) {
    const query = `
      DELETE FROM tb_company_documents 
      WHERE id = ? AND tenant_id = ?
    `;
    const [result] = await pool.execute(query, [id, tenantId]);
    return result.affectedRows > 0;
  }
}

module.exports = CompanyDocumentModel;

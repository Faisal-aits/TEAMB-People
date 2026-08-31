const CompanyDocumentModel = require('./companyDocumentModel');
const fs = require('fs');
const path = require('path');

exports.getAllDocuments = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const documents = await CompanyDocumentModel.getAll(tenantId);
    
    // Format documents
    const formattedDocs = documents.map(doc => ({
      ...doc,
      uploaded_by_name: doc.first_name ? `${doc.first_name} ${doc.last_name || ''}`.trim() : 'Admin'
    }));

    res.json({ success: true, data: formattedDocs });
  } catch (error) {
    console.error('Error fetching company documents:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch documents' });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    const { title, description, type, link_url, category } = req.body;

    if (!title || !type) {
      return res.status(400).json({ success: false, message: 'Title and type are required' });
    }

    let file_url = null;
    
    if (type === 'file') {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'File is required for file type documents' });
      }
      // Store relative path (e.g., uploads/documents/doc-123.pdf)
      file_url = 'uploads/documents/' + req.file.filename;
    } else if (type === 'link') {
      if (!link_url) {
        return res.status(400).json({ success: false, message: 'Link URL is required for link type documents' });
      }
    }

    const documentData = {
      tenant_id: tenantId,
      title,
      description,
      type,
      file_url,
      link_url,
      category,
      uploaded_by: userId
    };

    const newDocId = await CompanyDocumentModel.create(documentData);
    const newDoc = await CompanyDocumentModel.getById(newDocId, tenantId);

    res.status(201).json({ success: true, message: 'Document added successfully', data: newDoc });
  } catch (error) {
    console.error('Error creating company document:', error);
    res.status(500).json({ success: false, message: 'Failed to add document' });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const tenantId = req.user.tenant_id;
    const docId = req.params.id;

    const doc = await CompanyDocumentModel.getById(docId, tenantId);
    
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    const deleted = await CompanyDocumentModel.delete(docId, tenantId);

    if (deleted) {
      // If it's a file, try to delete the physical file
      if (doc.type === 'file' && doc.file_url) {
        try {
          const filePath = path.join(__dirname, '../../../../', doc.file_url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          console.error('Failed to delete physical file:', err);
          // Don't fail the request if file deletion fails
        }
      }
      
      res.json({ success: true, message: 'Document deleted successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to delete document' });
    }
  } catch (error) {
    console.error('Error deleting company document:', error);
    res.status(500).json({ success: false, message: 'Server error during deletion' });
  }
};

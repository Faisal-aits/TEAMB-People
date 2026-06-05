const express = require('express');
const router = express.Router();
const controller = require('./aiDocumentGeneratorController');
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');
const model = require('./aiDocumentGeneratorModel');

router.use(verifyToken);
router.use(requireAdmin);

router.post('/templates/analyze', controller.upload.single('file'), controller.analyzeUpload);
router.get('/templates', controller.listTemplates);
router.post('/templates', controller.createTemplate);
router.get('/templates/:id', controller.getTemplate);
router.put('/templates/:id', controller.updateTemplate);
router.delete('/templates/:id', controller.deleteTemplate);
router.post('/templates/:id/generate', controller.createGeneratedDocument);
router.get('/generated', controller.listGeneratedDocuments);

module.exports = router;
module.exports.ensureSchema = () => model.ensureSchema();

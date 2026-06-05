const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');
const moduleAccessController = require('./moduleAccessController');
const moduleAccessModel = require('./moduleAccessModel');

router.use(verifyToken);

router.get('/my-modules', moduleAccessController.getMyModules);

router.get('/users', requireAdmin, moduleAccessController.listUsers);
router.get('/users/:userId', requireAdmin, moduleAccessController.getUserAccess);
router.put('/users/:userId', requireAdmin, moduleAccessController.updateUserAccess);

module.exports = router;
module.exports.ensureSchema = () => moduleAccessModel.ensureSchema();

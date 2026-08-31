// backend/src/features/settings/settingsRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/auth.middleware');
const settingsController = require('./settingsController');

router.use(authMiddleware.verifyToken);

router.get('/', settingsController.getAll);
router.get('/:key', settingsController.get);
router.put('/:key', settingsController.set);
router.put('/', settingsController.setMany);

module.exports = router;

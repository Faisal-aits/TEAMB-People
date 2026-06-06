const express = require('express');
const router = express.Router();
const projectController = require('./projectController');
const { verifyToken } = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');

router.use(verifyToken);

router.get('/my', projectController.getMyProjects);
router.get('/my-tasks', projectController.getMyTasks);

router.use(requireAdmin);

router.get('/stats', projectController.getProjectStats);
router.get('/', projectController.getAllProjects);
router.get('/:id', projectController.getProjectById);
router.post('/', projectController.createProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

module.exports = router;

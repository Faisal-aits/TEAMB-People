// backend/src/features/pttm/pttmRoutes.js

const { Router } = require('express');
const pttmController = require('./pttmController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');
const requireModuleAccess = require('../../middleware/requireModuleAccess');

const router = Router();

// Apply auth middleware globally to all task manager endpoints
router.use(authMiddleware.verifyToken);
router.use(requireModuleAccess('pttm', 'read'));

// Seeding endpoint
router.post('/seed', requireAdmin, pttmController.seedDatabase);

// Projects endpoints removed (handled by Service Management module)

// Team members (users)
router.get('/users', pttmController.getUsers);

// Teams
router.get('/teams', pttmController.getTeams);
router.post('/teams', requireModuleAccess('pttm', 'write'), pttmController.createTeam);
router.delete('/teams/:id', requireModuleAccess('pttm', 'write'), pttmController.deleteTeam);

// Phases
router.get('/phases', pttmController.getPhases);
router.post('/phases', requireModuleAccess('pttm', 'write'), pttmController.createPhase);
router.delete('/phases/:id', requireModuleAccess('pttm', 'write'), pttmController.deletePhase);

// Tasks
router.get('/tasks', pttmController.getTasks);
router.post('/tasks', requireModuleAccess('pttm', 'write'), pttmController.createTask);
router.post('/tasks/insert', requireModuleAccess('pttm', 'write'), pttmController.insertTask);
router.put('/tasks/:id', requireModuleAccess('pttm', 'write'), pttmController.updateTask);
router.patch('/tasks/:id', requireModuleAccess('pttm', 'write'), pttmController.patchTaskField);
router.delete('/tasks/:id', requireModuleAccess('pttm', 'write'), pttmController.deleteTask);
router.post('/tasks/:id/duplicate', requireModuleAccess('pttm', 'write'), pttmController.duplicateTask);

// Docflow / Checklists
router.get('/docflow/:project_id', pttmController.getDocflow);
router.put('/docflow/:project_id/:phase_num', requireModuleAccess('pttm', 'write'), pttmController.upsertDocflow);
router.post('/docflow/:project_id/:phase_num/files', requireModuleAccess('pttm', 'write'), pttmController.uploadDocflowFile);
router.delete('/docflow/:project_id/:phase_num/files/:file_id', requireModuleAccess('pttm', 'write'), pttmController.deleteDocflowFile);

module.exports = router;
module.exports.ensureSchema = () => require('./pttmModel').ensureSchema();

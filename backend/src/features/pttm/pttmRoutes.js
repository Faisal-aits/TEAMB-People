// backend/src/features/pttm/pttmRoutes.js

const { Router } = require('express');
const pttmController = require('./pttmController');
const authMiddleware = require('../../middleware/auth.middleware');

const router = Router();

// Apply auth middleware globally to all task manager endpoints
router.use(authMiddleware.verifyToken);

// Seeding endpoint
router.post('/seed', pttmController.seedDatabase);

// Projects endpoints removed (handled by Service Management module)

// Team members (users)
router.get('/users', pttmController.getUsers);

// Teams
router.get('/teams', pttmController.getTeams);
router.post('/teams', pttmController.createTeam);
router.delete('/teams/:id', pttmController.deleteTeam);

// Phases
router.get('/phases', pttmController.getPhases);
router.post('/phases', pttmController.createPhase);
router.delete('/phases/:id', pttmController.deletePhase);

// Tasks
router.get('/tasks', pttmController.getTasks);
router.post('/tasks', pttmController.createTask);
router.post('/tasks/insert', pttmController.insertTask);
router.put('/tasks/:id', pttmController.updateTask);
router.patch('/tasks/:id', pttmController.patchTaskField);
router.delete('/tasks/:id', pttmController.deleteTask);
router.post('/tasks/:id/duplicate', pttmController.duplicateTask);

// Docflow / Checklists
router.get('/docflow/:project_id', pttmController.getDocflow);
router.put('/docflow/:project_id/:phase_num', pttmController.upsertDocflow);
router.post('/docflow/:project_id/:phase_num/files', pttmController.uploadDocflowFile);
router.delete('/docflow/:project_id/:phase_num/files/:file_id', pttmController.deleteDocflowFile);

module.exports = router;
module.exports.ensureSchema = () => require('./pttmModel').ensureSchema();

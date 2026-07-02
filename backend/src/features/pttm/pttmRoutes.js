// backend/src/features/pttm/pttmRoutes.js

const { Router } = require('express');
const pttmController = require('./pttmController');
const authMiddleware = require('../../middleware/auth.middleware');
const requireAdmin = require('../../middleware/requireAdmin');
const requireModuleAccess = require('../../middleware/requireModuleAccess');
const { query } = require('../../config/db');

const router = Router();

// Apply auth middleware globally to all task manager endpoints
router.use(authMiddleware.verifyToken);

// Helper check for PTTM module access
const checkPttmAccess = async (req, minLevel) => {
  const role = req.user?.role || req.user?.position || req.user?.role_name;
  if (role === 'admin') return true;

  const userId = req.user?.id || req.user?.user_id;
  const tenantId = req.tenantId || req.user?.tenant_id || 1;

  if (!userId) return false;

  const accessMeetsLevel = (access, minLevel) => {
    if (!access || access === 'none') return false;
    if (minLevel === 'read') return access === 'read' || access === 'write';
    if (minLevel === 'write') return access === 'write';
    return false;
  };

  const rows = await query(
    `SELECT access_level
     FROM user_module_access
     WHERE user_id = ? AND tenant_id = ? AND module_key = ?`,
    [userId, tenantId, 'pttm']
  );

  return rows.some((row) => accessMeetsLevel(row.access_level, minLevel));
};

// Middleware to check if user has access to a specific task (either admin, pttm access, or task owner)
const requireTaskAccess = async (req, res, next) => {
  try {
    const isWrite = ['PUT', 'PATCH', 'POST', 'DELETE'].includes(req.method);
    const minLevel = isWrite ? 'write' : 'read';

    const hasAccess = await checkPttmAccess(req, minLevel);
    if (hasAccess) return next();

    const taskId = req.params.id;
    if (!taskId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const tenantId = req.tenantId || req.user?.tenant_id || 1;
    const taskRows = await query(
      'SELECT id, assigned_user_id, status, review_status FROM pttm_tasks WHERE id = ? AND tenant_id = ?',
      [taskId, tenantId]
    );
    const task = taskRows[0];

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const userId = req.user?.id || req.user?.user_id;
    if (String(task.assigned_user_id) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied: You are not assigned to this task' });
    }

    // For updates, block if task is currently under review
    const isUnderReview = task.review_status === 'Pending Review' || task.status === 'Under Review';
    if (isUnderReview) {
      return res.status(403).json({ error: 'Access denied: Task is currently under review' });
    }

    // For PUT or PATCH, verify only 'status' and 'remarks' are being modified
    if (req.method === 'PUT' || req.method === 'PATCH') {
      const payload = req.body || {};
      const fields = req.method === 'PATCH' 
        ? [payload.field] 
        : Object.keys(payload);

      const allowedFields = ['status', 'remarks'];
      const hasInvalid = fields.some(f => !allowedFields.includes(f) && payload[f] !== undefined && payload[f] !== task[f]);
      
      if (hasInvalid) {
        return res.status(403).json({ error: 'Access denied: Employees can only edit task status and remarks' });
      }
    }

    return next();
  } catch (error) {
    console.error('requireTaskAccess error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Seeding endpoint
router.post('/seed', requireAdmin, pttmController.seedDatabase);

// Team members (users)
router.get('/users', requireModuleAccess('pttm', 'read'), pttmController.getUsers);

// Teams
router.get('/teams', requireModuleAccess('pttm', 'read'), pttmController.getTeams);
router.post('/teams', requireModuleAccess('pttm', 'write'), pttmController.createTeam);
router.delete('/teams/:id', requireModuleAccess('pttm', 'write'), pttmController.deleteTeam);

// Phases
router.get('/phases', requireModuleAccess('pttm', 'read'), pttmController.getPhases);
router.post('/phases', requireModuleAccess('pttm', 'write'), pttmController.createPhase);
router.delete('/phases/:id', requireModuleAccess('pttm', 'write'), pttmController.deletePhase);

// Modules
router.get('/modules', requireModuleAccess('pttm', 'read'), pttmController.getModules);
router.post('/modules', requireModuleAccess('pttm', 'write'), pttmController.createModule);
router.put('/modules/:id', requireModuleAccess('pttm', 'write'), pttmController.updateModule);
router.delete('/modules/:id', requireModuleAccess('pttm', 'write'), pttmController.deleteModule);

// Tasks
router.get('/tasks', requireModuleAccess('pttm', 'read'), pttmController.getTasks);
router.post('/tasks', requireModuleAccess('pttm', 'write'), pttmController.createTask);
router.post('/tasks/insert', requireModuleAccess('pttm', 'write'), pttmController.insertTask);

// Review workflow — named routes MUST come before /:id param routes
router.get('/tasks/pending-review', requireModuleAccess('pttm', 'read'), pttmController.getPendingReviewTasks);
router.post('/tasks/:id/submit-review', requireTaskAccess, pttmController.submitForReview);
router.post('/tasks/:id/review', requireModuleAccess('pttm', 'write'), pttmController.reviewTask);

router.put('/tasks/:id', requireTaskAccess, pttmController.updateTask);
router.patch('/tasks/:id', requireTaskAccess, pttmController.patchTaskField);
router.delete('/tasks/:id', requireModuleAccess('pttm', 'write'), pttmController.deleteTask);
router.post('/tasks/:id/duplicate', requireModuleAccess('pttm', 'write'), pttmController.duplicateTask);

// Docflow / Checklists
router.get('/docflow/:project_id', requireModuleAccess('pttm', 'read'), pttmController.getDocflow);
router.put('/docflow/:project_id/:phase_num', requireModuleAccess('pttm', 'write'), pttmController.upsertDocflow);
router.post('/docflow/:project_id/:phase_num/files', requireModuleAccess('pttm', 'write'), pttmController.uploadDocflowFile);
router.delete('/docflow/:project_id/:phase_num/files/:file_id', requireModuleAccess('pttm', 'write'), pttmController.deleteDocflowFile);

module.exports = router;
module.exports.ensureSchema = () => require('./pttmModel').ensureSchema();


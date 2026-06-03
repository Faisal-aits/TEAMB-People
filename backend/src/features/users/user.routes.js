const { Router } = require('express');
const userController = require('./user.controller');
const authMiddleware = require('../../middleware/auth.middleware');

const router = Router();

// Flow: route -> controller -> service -> repository -> shared DB pool.
router.get('/', authMiddleware.verifyToken, userController.listUsers);
router.get('/:id', authMiddleware.verifyToken, userController.getUserById);
router.post('/', authMiddleware.verifyToken, userController.createUser);
router.patch('/:id', authMiddleware.verifyToken, userController.updateUser);
router.delete('/:id', authMiddleware.verifyToken, userController.deleteUser);

module.exports = router;

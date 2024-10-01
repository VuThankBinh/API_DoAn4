const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/gatewayAuth');

// router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:email', authenticateToken, userController.getUserByEmail);
// Thêm các route khác cho người dùng ở đây
// router.get('/get-class/:userId', authenticateToken, userController.getUserClasses);
module.exports = router;
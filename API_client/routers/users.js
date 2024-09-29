const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');

// router.get('/', authenticateToken, userController.getAllUsers);
router.get('/:email', authenticateToken, userController.getUserByEmail);
// Thêm các route khác cho người dùng ở đây
router.get('/get-class/:userId', userController.getUserClasses);
module.exports = router;
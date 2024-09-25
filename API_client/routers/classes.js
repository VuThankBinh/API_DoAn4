const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/create', authenticateToken, classController.createClass);
router.post('/join', authenticateToken, classController.joinClass);
router.post('/leave', authenticateToken, classController.leaveClass);
router.post('/delete', authenticateToken, classController.deleteClass);

module.exports = router;
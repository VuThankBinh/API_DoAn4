const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/create', authenticateToken, classController.createClass);
// Thêm các route khác cho lớp học ở đây

module.exports = router;
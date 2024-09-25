const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', authenticateToken, lessonController.getAllLessons);
router.get('/:id', authenticateToken, lessonController.getLessonById);
// Thêm các route khác cho bài học ở đây

module.exports = router;
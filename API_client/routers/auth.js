const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/reset-password', authController.resetPassword);
router.post('/change-password', authController.changePassword);

// Thêm route mới để xác minh token
router.get('/verify-token', authenticateToken, (req, res) => {
    res.status(200).json({ message: 'Token hợp lệ', user: req.user });
});

module.exports = router;
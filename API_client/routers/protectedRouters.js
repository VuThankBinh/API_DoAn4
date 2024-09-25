const express = require('express');
const { authenticateToken } = require('../utils/authUtils');

const router = express.Router();

router.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Đây là dữ liệu được bảo vệ', user: req.user });
});

// Bạn có thể thêm các route được bảo vệ khác ở đây
router.get('/user-info', authenticateToken, (req, res) => {
    res.json({ message: 'Thông tin người dùng', user: req.user });
});

module.exports = router;
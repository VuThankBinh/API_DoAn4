const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user'); // Giả sử bạn có model User
const { generateToken } = require('../utils/authUtils');

const router = express.Router();

// Route đăng nhập
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        const token = generateToken(user);
        res.json({ message: 'Đăng nhập thành công', token });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// Route đăng ký (nếu cần)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword, name });
        await newUser.save();

        const token = generateToken(newUser);
        res.status(201).json({ message: 'Đăng ký thành công', token });
    } catch (error) {
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

module.exports = router;
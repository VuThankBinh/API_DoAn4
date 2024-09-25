const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const otpUtils = require('../utils/otpUtils');

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

exports.register = async (req, res) => {
    try {
        const { email, accountType, password, isGoogleSignUp } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email đã tồn tại' });
        }

        let newUser = new User({ email, accountType });

        if (!isGoogleSignUp) {
            if (!password) {
                return res.status(400).json({ error: 'Mật khẩu là bắt buộc khi đăng ký bằng email' });
            }
            newUser.password = await bcrypt.hash(password, 10);
        }

        await newUser.save();

        res.status(201).json({
            message: 'Đăng ký thành công',
            userId: newUser._id
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

exports.login = async (req, res) => { 
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            SECRET_KEY,
            { expiresIn: '1h' }
        );

        res.json({ message: 'Đăng nhập thành công', token });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Thêm các hàm xử lý khác như sendOTP, verifyOTP, resetPassword ở đây
const User = require('../models/user');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

exports.getUserByEmail = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.email });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Thêm các hàm xử lý khác cho người dùng ở đây
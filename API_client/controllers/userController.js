const User = require('../models/user');
const Class = require('../models/class'); // Giả sử bạn có model Class

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
//lỗi này 
exports.getUserClasses = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).populate('classes');
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        const classesWithNames = await Promise.all(user.joinedClasses.map(async (classId) => {
            const classDetails = await Class.findById(classId);
            return {
                _id: classId,
                name: classDetails ? classDetails.name : 'Không có tên'
            };
        }));

        res.json(classesWithNames);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách lớp học của người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Thêm các hàm xử lý khác cho người dùng ở đây
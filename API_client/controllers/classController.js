const Class = require('../models/class');
const User = require('../models/user');
const { generateClassId } = require('../utils/classUtils');

exports.createClass = async (req, res) => {
    try {
        const { name, teacher } = req.body;

        if (!name || !teacher) {
            return res.status(400).json({ error: 'Tên lớp và email giáo viên là bắt buộc' });
        }

        const teacherUser = await User.findOne({ email: teacher });
        if (!teacherUser) {
            return res.status(404).json({ error: 'Không tìm thấy giáo viên' });
        }

        const class_id = await generateClassId();

        const newClass = new Class({
            name,
            class_id,
            teacher,
            users: []
        });

        await newClass.save();

        await User.updateOne(
            { email: teacher },
            { $push: { createdClasses: class_id } }
        );

        res.status(201).json({
            message: 'Tạo lớp học thành công',
            class: newClass
        });
    } catch (error) {
        console.error('Lỗi khi tạo lớp học:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Thêm các hàm xử lý khác cho lớp học ở đây
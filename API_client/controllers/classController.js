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

exports.joinClass = async (req, res) => {
    try {
        const { email, class_id } = req.body;

        if (!email || !class_id) {
            return res.status(400).json({ message: 'Email và class_id là bắt buộc' });
        }

        const classToJoin = await Class.findOne({ class_id });
        if (!classToJoin) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        if (classToJoin.users.includes(email)) {
            return res.status(400).json({ message: 'Người dùng đã tham gia lớp học này' });
        }

        classToJoin.users.push(email);
        await classToJoin.save();

        user.joinedClasses.push(class_id);
        await user.save();

        res.status(200).json({ message: 'Tham gia lớp học thành công' });
    } catch (error) {
        console.error('Lỗi khi tham gia lớp học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.leaveClass = async (req, res) => {
    try {
        const { email, class_id } = req.body;

        if (!email || !class_id) {
            return res.status(400).json({ message: 'Email và class_id là bắt buộc' });
        }

        const classToLeave = await Class.findOne({ class_id });
        if (!classToLeave) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        classToLeave.users = classToLeave.users.filter(userEmail => userEmail !== email);
        await classToLeave.save();

        user.joinedClasses = user.joinedClasses.filter(joinedClass => joinedClass !== class_id);
        await user.save();

        res.status(200).json({ message: 'Rời khỏi lớp học thành công' });
    } catch (error) {
        console.error('Lỗi khi rời khỏi lớp học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.deleteClass = async (req, res) => {
    try {
        const { teacher, class_id } = req.body;

        if (!teacher || !class_id) {
            return res.status(400).json({ message: 'Email giáo viên và class_id là bắt buộc' });
        }

        const classToDelete = await Class.findOne({ class_id, teacher });
        if (!classToDelete) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc bạn không có quyền xóa' });
        }

        // Xóa class_id khỏi joinedClasses của tất cả học sinh trong lớp
        await User.updateMany(
            { email: { $in: classToDelete.users } },
            { $pull: { joinedClasses: class_id } }
        );

        // Xóa class_id khỏi createdClasses của giáo viên
        await User.updateOne(
            { email: teacher },
            { $pull: { createdClasses: class_id } }
        );

        // Xóa lớp học
        await Class.deleteOne({ class_id });

        res.status(200).json({ message: 'Xóa lớp học thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa lớp học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};
// Thêm các hàm xử lý khác cho lớp học ở đây
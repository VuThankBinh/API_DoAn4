const Lesson = require('../models/lesson');

exports.getAllLessons = async (req, res) => {
    try {
        const lessons = await Lesson.find({}, 'name image condition theory');
        if (lessons.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bài học nào' });
        }
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.getLessonById = async (req, res) => {
    try {
        const lesson = await Lesson.findById(req.params.id);
        if (!lesson) {
            return res.status(404).json({ message: 'Không tìm thấy bài học' });
        }
        res.status(200).json(lesson);
    } catch (error) {
        console.error('Lỗi khi lấy bài học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Thêm các hàm xử lý khác cho bài học ở đây
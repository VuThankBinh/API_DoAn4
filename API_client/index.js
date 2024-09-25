const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const app = express();
const url = 'mongodb://localhost:27017';
const dbName = 'database';

app.use(express.json());

const SECRET_KEY = 'your_secret_key'; // Nên lưu trong biến môi trường

async function connectToMongoDB() {
    const client = new MongoClient(url);
    await client.connect();
    console.log('Kết nối thành công đến MongoDB');
    return client.db(dbName);
}

// Hàm tạo class_id ngẫu nhiên
function generateClassId() {
    return crypto.randomBytes(3).toString('hex');
}

// Hàm tạo OTP ngẫu nhiên và duy nhất (chỉ gồm số)
async function generateUniqueOTP(email, db) {
    const otpsCollection = db.collection('otps');
    let otp;
    let existingOTP;
    
    do {
        // Tạo OTP 6 chữ số
        otp = Math.floor(100000 + Math.random() * 900000).toString();
        existingOTP = await otpsCollection.findOne({ otp, email });
    } while (existingOTP);
    
    return otp;
}

// Cấu hình nodemailer (thay thế bằng thông tin SMTP của bạn)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aigoaitutor@gmail.com',
    pass: 'qhlh fgks lvpn kija'  // Thay thế bằng Mật khẩu ứng dụng bạn vừa tạo
  }
});
//api hello
app.get('/', (req, res) => {
    res.send('API đang chạy rồi bắt đầu test đi');
});
// API để lấy tất cả người dùng
app.get('/users', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users');
        const users = await collection.find({}).toArray();
        res.json(users);
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API để lấy một người dùng theo email
app.get('/users/:email', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users');
        const user = await collection.findOne({ email: req.params.email });
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API đăng ký người dùng mới
app.post('/users/register', async (req, res) => {
    try {
        const { email, accountType, password, isGoogleSignUp } = req.body;

        // Kiểm tra xem email đã tồn tại chưa
        const db = await connectToMongoDB();
        const collection = db.collection('users');
        const existingUser = await collection.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Email đã tồn tại' });
        }

        // Tạo người dùng mới
        let newUser = {
            email,
            accountType,
            name: '',
            tel: '',
            joinedClasses: [],
            createdClasses: [],
            lessonsCompleted: []
        };

        // Nếu không phải đăng ký bằng Google, thêm mật khẩu
        if (!isGoogleSignUp) {
            if (!password) {
                return res.status(400).json({ error: 'Mật khẩu là bắt buộc khi đăng ký bằng email' });
            }
            newUser.password = password;
        }

        const result = await collection.insertOne(newUser);

        res.status(201).json({
            message: 'Đăng ký thành công',
            userId: result.insertedId
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// API đăng nhập
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const db = await connectToMongoDB();
        const collection = db.collection('users');
        const user = await collection.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
        }

        // Tạo token
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            SECRET_KEY,
            { expiresIn: '1h' } // Token hết hạn sau 1 giờ
        );

        res.json({ message: 'Đăng nhập thành công', token });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Middleware kiểm tra token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// API yêu cầu xác thực
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Đây là dữ liệu được bảo vệ', user: req.user });
});

// API tạo lớp học mới
app.post('/classes/create', async (req, res) => {
    try {
        const { name, teacher } = req.body;

        if (!name || !teacher) {
            return res.status(400).json({ error: 'Tên lớp và email giáo viên là bắt buộc' });
        }

        const db = await connectToMongoDB();
        const classesCollection = db.collection('classes');
        const usersCollection = db.collection('users');

        // Check if teacher exists
        const teacherUser = await usersCollection.findOne({ email: teacher });
        if (!teacherUser) {
            return res.status(404).json({ error: 'Không tìm thấy giáo viên' });
        }

        let class_id;
        let existingClass;

        // Tạo class_id độc nhất
        do {
            class_id = generateClassId();
            existingClass = await classesCollection.findOne({ class_id });
        } while (existingClass);

        const newClass = {
            name,
            class_id,
            teacher,
            users: []
        };

        const result = await classesCollection.insertOne(newClass);

        // Add class_id to teacher's createdClasses
        await usersCollection.updateOne(
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
});

// API để học sinh tham gia lớp học
app.post('/classes/join', async (req, res) => {
    try {
        const { email, class_id } = req.body;

        // Validate input
        if (!email || !class_id) {
            return res.status(400).json({ message: 'Email và class_id là bắt buộc' });
        }

        const db = await connectToMongoDB();
        const usersCollection = db.collection('users');
        const classesCollection = db.collection('classes');

        // Check if user exists
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Check if class exists
        const classToJoin = await classesCollection.findOne({ class_id });
        if (!classToJoin) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Check if email is not the teacher's email
        if (classToJoin.teacher === email) {
            return res.status(400).json({ message: 'Giáo viên không thể tham gia lớp học của mình như một học sinh' });
        }

        // Check if user is already in the class
        if (classToJoin.users.includes(email)) {
            return res.status(400).json({ message: 'Người dùng đã tham gia lớp học này' });
        }

        // Add email to users array in the class document
        await classesCollection.updateOne(
            { class_id },
            { $push: { users: email } }
        );

        // Add class_id to joinedClasses array in the user document
        await usersCollection.updateOne(
            { email },
            { $push: { joinedClasses: class_id } }
        );

        res.status(200).json({ message: 'Tham gia lớp học thành công' });
    } catch (error) {
        console.error('Lỗi khi tham gia lớp học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để học sinh rời khỏi lớp học
app.post('/classes/leave', async (req, res) => {
    try {
        const { email, class_id } = req.body;

        // Validate input
        if (!email || !class_id) {
            return res.status(400).json({ message: 'Email và class_id l bt buộc' });
        }

        const db = await connectToMongoDB();
        const usersCollection = db.collection('users');
        const classesCollection = db.collection('classes');

        // Check if user exists
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Check if class exists
        const classToLeave = await classesCollection.findOne({ class_id });
        if (!classToLeave) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Check if user is in the class
        if (!classToLeave.users.includes(email)) {
            return res.status(400).json({ message: 'Người dùng không thuộc lớp học này' });
        }

        // Remove email from users array in the class document
        await classesCollection.updateOne(
            { class_id },
            { $pull: { users: email } }
        );

        // Remove class_id from joinedClasses array in the user document
        await usersCollection.updateOne(
            { email },
            { $pull: { joinedClasses: class_id } }
        );

        res.status(200).json({ message: 'Rời khỏi lớp học thành công' });
    } catch (error) {
        console.error('Lỗi khi rời khỏi lớp học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để xóa lớp học
app.post('/classes/delete', async (req, res) => {
    try {
        const { teacher, class_id } = req.body;

        // Validate input
        if (!teacher || !class_id) {
            return res.status(400).json({ message: 'Email giáo viên và class_id là bắt buộc' });
        }

        const db = await connectToMongoDB();
        const usersCollection = db.collection('users');
        const classesCollection = db.collection('classes');

        // Check if class exists
        const classToDelete = await classesCollection.findOne({ class_id });
        if (!classToDelete) {
            return res.status(404).json({ message: 'Không tìm thấy lớp học' });
        }

        // Check if the teacher is the owner of the class
        if (classToDelete.teacher !== teacher) {
            return res.status(403).json({ message: 'Chỉ giáo viên của lớp mới có thể xóa lớp học' });
        }

        // Remove class_id from joinedClasses of all users in the class
        await usersCollection.updateMany(
            { email: { $in: classToDelete.users } },
            { $pull: { joinedClasses: class_id } }
        );

        // Remove class_id from createdClasses of the teacher
        await usersCollection.updateOne(
            { email: teacher },
            { $pull: { createdClasses: class_id } }
        );

        // Delete the class
        await classesCollection.deleteOne({ class_id });

        res.status(200).json({ message: 'Xóa lớp học thành công' });
    } catch (error) {
        console.error('Lỗi khi xóa lớp học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để lấy tất cả các bài học với các trường cụ thể
app.get('/lessons', async (req, res) => {
    try {
        const db = await connectToMongoDB();
        const lessonsCollection = db.collection('lessons');

        // Lấy bài học với các trường cụ thể
        const lessons = await lessonsCollection.find({}, {
            projection: {
                name: 1,
                image: 1,
                condition: 1,
                theory: 1,
                _id: 1 // Loại bỏ trường _id nếu không cần thiết
            }
        }).toArray();

        // Kiểm tra nếu không có bài học nào
        if (lessons.length === 0) {
            return res.status(404).json({ message: 'Không tìm thấy bài học nào' });
        }

        // Tr về danh sách bài học
        res.status(200).json(lessons);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách bài học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để lấy một bài học cụ thể theo _id
app.get('/lessons/:id', async (req, res) => {
    try {
        const lessonId = req.params.id;

        // Kiểm tra tính hợp lệ của _id
        if (!ObjectId.isValid(lessonId)) {
            return res.status(400).json({ message: 'ID bài học không hợp lệ' });
        }

        const db = await connectToMongoDB();
        const lessonsCollection = db.collection('lessons');

        // Tìm bài học theo _id
        const lesson = await lessonsCollection.findOne({ _id: new ObjectId(lessonId) });

        // Kiểm tra nếu không tìm thấy bài học
        if (!lesson) {
            return res.status(404).json({ message: 'Không tìm thấy bài học' });
        }

        // Trả về bài học
        res.status(200).json(lesson);
    } catch (error) {
        console.error('Lỗi khi lấy bài học:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để gửi OTP
app.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        const db = await connectToMongoDB();
        const otpsCollection = db.collection('otps');

        const otp = await generateUniqueOTP(email, db);

        // Xóa các OTP cũ của email này
        await otpsCollection.deleteMany({ email });

        // Lưu OTP mới vào database với thời hạn 60 giây
        await otpsCollection.insertOne({ 
            email, 
            otp, 
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 120000) // OTP hết hạn sau 60 giây
        });

        // Gửi email chứa OTP
        const mailOptions = {
            from: 'bnp.studio2003@gmail.com',
            to: email,
            subject: 'Mã OTP của bạn',
            text: `Mã OTP của bạn là: ${otp}. Mã này gồm 6 chữ số và sẽ hết hạn sau 120 giây.`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'OTP đã được gửi đến email của bạn. Vui lòng nhập trong vòng 60 giây.' });
    } catch (error) {
        console.error('Lỗi khi gửi OTP:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để xác thực OTP
app.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email và OTP là bắt buộc' });
        }

        const db = await connectToMongoDB();
        const otpsCollection = db.collection('otps');

        // Tìm OTP cho email này
        const storedOTP = await otpsCollection.findOne({ email, otp });

        if (!storedOTP) {
            return res.status(404).json({ message: 'OTP không đúng hoặc đã hết hạn' });
        }

        // Kiểm tra OTP có hết hạn chưa
        if (new Date() > storedOTP.expiresAt) {
            await otpsCollection.deleteOne({ _id: storedOTP._id });
            return res.status(400).json({ message: 'OTP đã hết hạn' });
        }

        // Xóa OTP đã sử dụng
        await otpsCollection.deleteOne({ _id: storedOTP._id });

        res.status(200).json({ message: 'Xác thực OTP thành công' });
    } catch (error) {
        console.error('Lỗi khi xác thực OTP:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để kiểm tra trạng thái của OTP
app.post('/check-otp-status', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }

        const db = await connectToMongoDB();
        const otpsCollection = db.collection('otps');

        // Tìm OTP mới nhất cho email này
        const latestOTP = await otpsCollection.findOne(
            { email },
            { sort: { createdAt: -1 } }
        );

        if (!latestOTP) {
            return res.status(404).json({ message: 'Không tìm thấy OTP cho email này' });
        }

        const now = new Date();
        const expirationTime = latestOTP.expiresAt;

        if (now > expirationTime) {
            // OTP đã hết hạn
            await otpsCollection.deleteOne({ _id: latestOTP._id });
            return res.status(200).json({ 
                status: 'expired',
                message: 'OTP đã hết hạn'
            });
        } else {
            // OTP vẫn còn hiệu lực
            const remainingTime = Math.ceil((expirationTime - now) / 1000); // Thời gian còn lại tính bằng giây
            return res.status(200).json({ 
                status: 'valid',
                message: 'OTP vẫn còn hiệu lực',
                remainingTime: remainingTime
            });
        }
    } catch (error) {
        console.error('Lỗi khi kiểm tra trạng thái OTP:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

// API để đặt lại mật khẩu (quên mật khẩu)
app.post('/reset-password', async (req, res) => {
    try {
        const { email, newPassword, otp } = req.body;

        // Kiểm tra dữ liệu đầu vào
        if (!email || !newPassword || !otp) {
            return res.status(400).json({ message: 'Email, mật khẩu mới và OTP là bắt buộc' });
        }

        const db = await connectToMongoDB();
        const usersCollection = db.collection('users');
        const otpsCollection = db.collection('otps');

        // Kiểm tra OTP
        const storedOTP = await otpsCollection.findOne({ email, otp });
        if (!storedOTP) {
            return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
        }

        // Kiểm tra xem OTP có còn hiệu lực không
        if (new Date() > storedOTP.expiresAt) {
            await otpsCollection.deleteOne({ _id: storedOTP._id });
            return res.status(400).json({ message: 'OTP đã hết hạn' });
        }

        // Tìm người dùng theo email
        const user = await usersCollection.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // Mã hóa mật khẩu mới
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu mới trong cơ sở dữ liệu
        await usersCollection.updateOne(
            { email },
            { $set: { password: hashedNewPassword } }
        );

        // Xóa OTP đã sử dụng
        await otpsCollection.deleteOne({ _id: storedOTP._id });

        res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
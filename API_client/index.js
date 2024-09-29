require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routers/auth');
const userRoutes = require('./routers/users');
const classRoutes = require('./routers/classes');
const lessonRoutes = require('./routers/lessons');
const jwtSecret = process.env.JWT_SECRET;
const cors = require('cors');
const { authenticateToken } = require('./utils/authUtils');
const app = express();
app.use(cors());

const hostname = 'demohostvtb.ddns.net';
// mongoose.connect('mongodb://localhost:27017/database', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// }).then(() => console.log('Kết nối thành công đến MongoDB'))
// .catch(err => console.error('Lỗi kết nối MongoDB:', err));
// Kết nối MongoDB

// mongodb://localhost:27017/database
// mongoose.connect('mongodb+srv://aigoaitutor:Mct7rAlN7KZXlWPG@database1.trcnk.mongodb.net/database')
mongoose.connect('mongodb://localhost:27017/database')
  .then(() => console.log('Kết nối thành công đến MongoDB'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));
app.use(cors({
    origin: '*', // Cho phép tất cả các domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
app.use(express.json());

// S�� dụng routes
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/classes', classRoutes);
app.use('/lessons', lessonRoutes);

// API hello
app.get('/', (req, res) => {
  res.send('API đang chạy rồi bắt đầu test đi');
});

// API kiểm tra token
app.get('/check-token', authenticateToken, (req, res) => {
  res.json({ message: 'Token hợp lệ', user: req.user });
});

// API được bảo vệ bởi token
app.get('/protected', authenticateToken, (req, res) => {
  res.json({ message: 'Đây là một API được bảo vệ', user: req.user });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});
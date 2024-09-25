require('dotenv').config();
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routers/auth');
const userRoutes = require('./routers/users');
const classRoutes = require('./routers/classes');
const lessonRoutes = require('./routers/lessons');
const jwtSecret = process.env.JWT_SECRET;
const { authenticateToken } = require('./utils/authUtils');
const app = express();

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/database', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Kết nối thành công đến MongoDB'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

app.use(express.json());

// Sử dụng routes
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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
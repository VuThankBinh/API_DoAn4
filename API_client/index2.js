const express = require('express');
const mongoose = require('mongoose');
const authRoutes = require('./routers/auth');
const userRoutes = require('./routers/users');
const classRoutes = require('./routers/classes');
const lessonRoutes = require('./routers/lessons');

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
//api hello
app.get('/', (req, res) => {
  res.send('API đang chạy rồi bắt đầu test đi');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
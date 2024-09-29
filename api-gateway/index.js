require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Middleware xác thực JWT
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) {
        return res.sendStatus(403);
      }

      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

// Route xác thực và cấp token
app.post('/login', (req, res) => {
  // Ở đây bạn sẽ xác thực người dùng với cơ sở dữ liệu
  // Giả sử xác thực thành công, ta sẽ tạo một token
  const token = jwt.sign({ username: req.body.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Route proxy đến API server
app.use('/api', authenticateJWT, async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${process.env.API_SERVER}${req.url}`,
      headers: {
        ...req.headers,
        host: new URL(process.env.API_SERVER).host,
      },
      data: req.body,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const NodeCache = require('node-cache');

const app = express();
app.use(express.json());

// Middleware xác thực JWT cho Gateway
const authenticateGatewayJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.GATEWAY_JWT_SECRET, (err, user) => {
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

// Cache middleware
const cache = new NodeCache({ stdTTL: 300, checkperiod: 320 });
app.use((req, res, next) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    console.log(`Cache hit for ${key}`);
    return res.send(cachedResponse);
  }

  res.sendResponse = res.send;
  res.send = (body) => {
    cache.set(key, body);
    res.sendResponse(body);
  };
  next();
});

// Định nghĩa các route không cần xác thực
const publicRoutes = new Set([
  '/auth/forgot-password',
  '/auth/register',
  '/auth/send-otp',
  '/auth/verify-otp',
  '/auth'
]);

// Tối ưu hóa hàm isPublicRoute
const isPublicRoute = (path) => {
  return publicRoutes.has(path) || Array.from(publicRoutes).some(route => path.startsWith(route));
};

// Tách riêng phần xử lý xác thực
const authRouter = express.Router();

// Route xác thực và cấp token cho Gateway
authRouter.post('/gateway-login', async (req, res) => {
  try {
    // Gọi API login của API client
    const response = await axios.post(`${process.env.API_SERVER}/auth/login`, req.body);

    if (response.data.token) {
      // Tạo Gateway token
      const gatewayToken = jwt.sign(
        { userId: response.data.user.id, email: response.data.user.email },
        process.env.GATEWAY_JWT_SECRET,
        { expiresIn: '1h' }
      );

      res.json({ gatewayToken, clientToken: response.data.token, user: response.data.user });
    } else {
      res.status(401).json({ error: 'Đăng nhập không thành công' });
    }
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    res.status(error.response?.status || 500).json(error.response?.data || { error: 'Lỗi server' });
  }
});

// Sử dụng router xác thực
app.use('/auth', authRouter);

// Middleware kiểm tra xác thực cho các route khác
app.use((req, res, next) => {
  const normalizedPath = req.path.startsWith('/api') ? req.path.slice(4) : req.path;

  if (isPublicRoute(normalizedPath)) {
    console.log('Public route accessed:', normalizedPath);
    next();
  } else {
    authenticateGatewayJWT(req, res, next);
  }
});

// Route handler chính
app.use('/api', async (req, res) => {
  console.log('Handling request for:', req.method, req.path);
  
  try {
    // Bỏ Authorization nếu là route public
    const isPublic = isPublicRoute(req.path);
    const headers = { ...req.headers };

    if (isPublic) {
      delete headers['Authorization'];
      console.log('Request to public route without Authorization header');
    }

    const response = await axios({
      method: req.method,
      url: `${process.env.API_SERVER}${req.url}`,
      headers: headers,
      data: req.body,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error in API request:', error.message);
    console.error('Detailed error from client API:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal server error' });
  }
});

// Log toàn bộ request
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`API Gateway running on port ${PORT}`));
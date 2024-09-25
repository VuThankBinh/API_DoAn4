const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'; // Nên sử dụng biến môi trường

// Hàm để lấy token từ header Authorization
function getTokenFromHeader(req) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7); // Cắt bỏ "Bearer " từ đầu chuỗi
    }
    return null;
}

// Middleware để xác thực token
function authenticateToken(req, res, next) {
    const token = getTokenFromHeader(req);
    if (token == null) return res.sendStatus(401); // Không có token

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token không hợp lệ
        req.user = user;
        next();
    });
}

// Hàm tạo token
function generateToken(user) {
    return jwt.sign(
        { userId: user._id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' } // Token hết hạn sau 1 giờ
    );
}

// Hàm xác thực token
function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

module.exports = {
    getTokenFromHeader,
    authenticateToken,
    generateToken,
    verifyToken
};
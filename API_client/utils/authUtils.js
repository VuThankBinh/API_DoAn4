const jwt = require('jsonwebtoken');
// 
// const JWT_SECRET = process.env.JWT_SECRET ; // Nên sử dụng biến môi trường

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
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token received:', token);
    console.log('JWT_SECRET:', process.env.JWT_SECRET);

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            console.error('Lỗi xác thực token:', err);
            return res.sendStatus(403);
        }
        console.log('Decoded user:', user);
        req.user = user;
        next();
    });
}

// Hàm tạo token
function generateToken(user) {
    console.log('Generating token for user:', user);
    return jwt.sign(
        { userId: user._id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '1h' } // Token hết hạn sau 1 giờ
    );
}

// Hàm xác thực token
function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
    getTokenFromHeader,
    authenticateToken,
    generateToken,
    verifyToken
};
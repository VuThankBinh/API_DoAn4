const crypto = require('crypto');

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

// Hàm tạo class_id ngẫu nhiên
function generateClassId() {
    return crypto.randomBytes(3).toString('hex');
}

// Hàm kiểm tra trạng thái OTP
async function checkOTPStatus(email, db) {
    const otpsCollection = db.collection('otps');

    const latestOTP = await otpsCollection.findOne(
        { email },
        { sort: { createdAt: -1 } }
    );

    if (!latestOTP) {
        return { status: 'not_found', message: 'Không tìm thấy OTP cho email này' };
    }

    const now = new Date();
    const expirationTime = latestOTP.expiresAt;

    if (now > expirationTime) {
        await otpsCollection.deleteOne({ _id: latestOTP._id });
        return { status: 'expired', message: 'OTP đã hết hạn' };
    } else {
        const remainingTime = Math.ceil((expirationTime - now) / 1000);
        return { 
            status: 'valid',
            message: 'OTP vẫn còn hiệu lực',
            remainingTime: remainingTime
        };
    }
}

// Hàm xác thực OTP
async function verifyOTP(email, otp, db) {
    const otpsCollection = db.collection('otps');

    const storedOTP = await otpsCollection.findOne({ email, otp });

    if (!storedOTP) {
        return { isValid: false, message: 'OTP không đúng hoặc đã hết hạn' };
    }

    if (new Date() > storedOTP.expiresAt) {
        await otpsCollection.deleteOne({ _id: storedOTP._id });
        return { isValid: false, message: 'OTP đã hết hạn' };
    }

    await otpsCollection.deleteOne({ _id: storedOTP._id });
    return { isValid: true, message: 'Xác thực OTP thành công' };
}

// Xuất các hàm để có thể sử dụng ở nơi khác
module.exports = {
    generateUniqueOTP,
    generateClassId,
    checkOTPStatus,
    verifyOTP
};
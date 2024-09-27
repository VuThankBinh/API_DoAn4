const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { generateOTP, verifyOTP } = require('../utils/otpUtils');
const { sendOTPEmail } = require('../utils/emailUtils');

const SECRET_KEY = process.env.JWT_SECRET || 'your_secret_key';

exports.register = async (req, res) => {
    try {
        const { email, accountType, password, isGoogleSignUp } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email đã tồn tại' });
        }

        let newUser = new User({ email, accountType });

        if (!isGoogleSignUp) {
            if (!password) {
                return res.status(400).json({ error: 'Mật khẩu là bắt buộc khi đăng ký bằng email' });
            }
            newUser.password = await bcrypt.hash(password, 10);
        }
        else{
            newUser.password = "google"
        }

        await newUser.save();

        res.status(201).json({
            message: 'Đăng ký thành công',
            userId: newUser._id
        });
    } catch (error) {
        console.error('Lỗi khi đăng ký người dùng:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

exports.login = async (req, res) => { 
    try {
        const { email, password, isGoogleSignIn,name } = req.body;
        let user = await User.findOne({ email });
        // console.log('Attempting login for user:', user);
        if (!user && isGoogleSignIn) {
            // Tạo tài khoản mới nếu đăng nhập Google và email chưa tồn tại
            user = new User({
                email,
                isGoogleSignIn: true,
                accountType: 'google',
                name: name,
                // Các trường khác có thể được thêm vào tùy theo yêu cầu của bạn
            });
            await user.save();
            console.log('New Google user created:', user);
        } else if (!user) {
            return res.status(401).json({ error: 'Email không tồn tại' });
        }

        // Xử lý đăng nhập Google
        if (isGoogleSignIn) {
            if (user.accountType !== 'google') {
                return res.status(401).json({ error: 'Tài khoản này không được liên kết với Google' });
            }
        } else {
            // Xử lý đăng nhập thông thường
            if (user.accountType !== 'email') {
                return res.status(401).json({ error: 'Vui lòng sử dụng đăng nhập bằng Google cho tài khoản này' });
            }
            
            if (!(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ error: 'Mật khẩu không đúng' });
            }
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // console.log('Generating token for user:', user);
        res.json({ message: 'Đăng nhập thành công', token, user: { id: user._id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Lỗi khi đăng nhập:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

exports.sendOTP = async (req, res) => {
    try {
        const { email, isResetPassword } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email là bắt buộc' });
        }
        if(isResetPassword){
            // Kiểm tra xem email có tồn tại trong cơ sở dữ liệu không
            const existingUser = await User.findOne({ email });
            if (!existingUser) {
                return res.status(404).json({ message: 'Email chưa được đăng ký' });
            }

        }
        else{}

        const otp = await generateOTP(email);
        
        // Sử dụng hàm sendOTPEmail thay vì sendEmail
        await sendOTPEmail(email, otp);

        res.status(200).json({ message: 'OTP đã được gửi đến email của bạn' });
    } catch (error) {
        console.error('Lỗi khi gửi OTP:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email và OTP là bắt buộc' });
        }

        const isValid = await verifyOTP(email, otp);

        if (!isValid) {
            return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
        }

        res.status(200).json({ message: 'Xác thực OTP thành công' });
    } catch (error) {
        console.error('Lỗi khi xác thực OTP:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword || !otp) {
            return res.status(400).json({ message: 'Email, mật khẩu mới và OTP là bắt buộc' });
        }

        // const isValid = await verifyOTP(email, otp);

        // if (!isValid) {
        //     return res.status(400).json({ message: 'OTP không hợp lệ hoặc đã hết hạn' });
        // }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        // res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
        if(res.status(200)){
            return res.status(200).json({ message: 'Đặt lại mật khẩu thành công' });
            console.log("Đặt lại mật khẩu thành công");
        }
        else{
            return res.status(400).json({ message: 'Đặt lại mật khẩu thất bại' });
        }
    } catch (error) {
        console.error('Lỗi khi đặt lại mật khẩu:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword,userId } = req.body;
        // const userId = req.user.userId; 
        // Giả sử userId được lưu trong req.user sau khi xác thực token

        // Tìm user trong database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        // Kiểm tra xem tài khoản có phải là tài khoản email không
        if (user.accountType !== 'email') {
            return res.status(400).json({ error: 'Không thể đổi mật khẩu cho tài khoản này' });
        }

        // Kiểm tra mật khẩu hiện tại
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
        }

        // Hash mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Cập nhật mật khẩu mới trong database
        user.password = hashedPassword;
        await user.save();

        res.json({ message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        console.error('Lỗi khi đổi mật khẩu:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
};
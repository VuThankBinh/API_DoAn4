const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'aigoaitutor@gmail.com',
    pass: 'qhlh fgks lvpn kija'  // Mật khẩu ứng dụng Gmail
  }
});

const emailUtils = {
  /**
   * Send an email
   * @param {string} to - Recipient email address
   * @param {string} subject - Email subject
   * @param {string} text - Plain text body
   * @param {string} html - HTML body (optional)
   * @returns {Promise} - Resolves with info about the sent email
   */
  sendEmail: async (to, subject, text, html) => {
    const mailOptions = {
      from: '"AI Go AI Tutor" <aigoaitutor@gmail.com>',
      to,
      subject,
      text,
      html
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email: ', error);
      throw error;
    }
  },

  /**
   * Send an OTP email
   * @param {string} to - Recipient email address
   * @param {string} otp - One-Time Password
   * @returns {Promise} - Resolves with info about the sent email
   */
  sendOTPEmail: async (to, otp) => {
    const subject = 'Your OTP for AI Go AI Tutor';
    const text = `Your One-Time Password (OTP) is: ${otp}. Please use this to complete your verification.`;
    const html = `
      <h1>Your One-Time Password (OTP)</h1>
      <p>Your OTP for AI Go AI Tutor is:</p>
      <h2 style="color: #4CAF50; font-size: 24px;">${otp}</h2>
      <p>Please use this to complete your verification.</p>
      <p>If you didn't request this OTP, please ignore this email.</p>
    `;

    return emailUtils.sendEmail(to, subject, text, html);
  },

  // Bạn có thể giữ lại hoặc xóa các phương thức khác tùy theo nhu cầu
  sendPasswordResetEmail: async (to, resetToken) => {
    const subject = 'Password Reset for AI Go AI Tutor';
    const text = `You requested a password reset. Please use the following token to reset your password: ${resetToken}`;
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset for your AI Go AI Tutor account. Please use the following token to reset your password:</p>
      <h2 style="color: #4CAF50; font-size: 24px;">${resetToken}</h2>
      <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    `;

    return emailUtils.sendEmail(to, subject, text, html);
  },

  sendWelcomeEmail: async (to, username) => {
    const subject = 'Welcome to AI Go AI Tutor!';
    const text = `Welcome, ${username}! We're glad you've joined AI Go AI Tutor.`;
    const html = `
      <h1>Welcome to AI Go AI Tutor, ${username}!</h1>
      <p>We're excited to have you on board. Here are some things you can do to get started:</p>
      <ul>
        <li>Complete your profile</li>
        <li>Explore our AI tutoring features</li>
        <li>Join a study group</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    `;

    return emailUtils.sendEmail(to, subject, text, html);
  }
};

module.exports = emailUtils;

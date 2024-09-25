const crypto = require('crypto');

// OTP storage (in-memory for demonstration, use a database in production)
const otpStorage = new Map();

const otpUtils = {
  generateOTP: async (email) => {
    const otp = crypto.randomInt(100000, 999999).toString();
    const expirationTime = Date.now() + 5 * 60 * 1000; // OTP expires in 5 minutes

    otpStorage.set(email, { otp, expirationTime });
    return otp;
  },

  verifyOTP: async (email, inputOTP) => {
    const storedOTPData = otpStorage.get(email);
    if (!storedOTPData) {
      return false;
    }

    const { otp, expirationTime } = storedOTPData;
    if (Date.now() > expirationTime) {
      otpStorage.delete(email);
      return false;
    }

    if (inputOTP === otp) {
      otpStorage.delete(email);
      return true;
    }

    return false;
  }
};

module.exports = otpUtils;
export default function generateOTP() {
    const otpLength = 6;
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < otpLength; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }


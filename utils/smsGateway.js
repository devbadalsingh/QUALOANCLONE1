import axios from "axios";

export const otpSent = async (mobile,otp) => {
    const res = await axios.post(
        `https://www.smsgatewayhub.com/api/mt/SendSMS?APIKey=zvaAjMDIyk6rXzXqrZY1GQ&senderid=NMFSPE&channel=2&DCS=0&flashsms=0&number=91${mobile}&text=Dear%20Customer%2C%20Your%20OTP%20is%20${otp}.%20It%20is%20valid%20for%2010%20mins.%20Please%20do%20not%20share%20this%20OTP%20with%20anyone.%20Use%20it%20to%20verify%20your%20mobile%20number.%20Naman%20Finlease%20Pvt.%20Ltd&route=1`
    );
    return res;
};


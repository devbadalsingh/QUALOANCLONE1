// config/otpUtil.js
import axios from "axios";

export const generateAadhaarOtp = async (aadhaar) => {
    try {
        // Construct the request payload
        const data = {
            uniqueId: "1234", // Adjust as needed if dynamic
            uid: aadhaar, // Aadhaar number
        };

        // API endpoint and headers
        const url = "https://svc.digitap.ai/ent/v3/kyc/intiate-kyc-auto";
        const headers = {
            authorization: process.env.DIGITAP_AUTH_KEY,
            "Content-Type": "application/json",
            "User-Agent": "curl/7.68.0",
        };

        // Send POST request to the API
        const response = await axios.post(url, data, { headers });

        // Check for a successful response
        if (response?.data?.code !== "200") {
            return { success: false, message: "Please enter a valid Aadhaar" };
        }

        // Return the successful response data
        return { success: true, data: response.data };
    } catch (error) {
        // Log and handle errors
        console.error("Error generating Aadhaar OTP:", error.message || error);

        // Return a custom error message
        return {
            success: false,
            message: "Failed to generate Aadhaar OTP. Please try again later.",
        };
    }
};

export const verifyAadhaarOtp = async (
    otp,
    transactionId,
    fwdp,
    codeVerifier
) => {
    const data = {
        shareCode: "1234",
        validateXml: true,
        otp,
        transactionId,
        fwdp,
        codeVerifier,
    };
    try {
        const response = await axios.post(
            "https://svc.digitap.ai/ent/v3/kyc/submit-otp",
            data,
            {
                headers: {
                    authorization: process.env.DIGITAP_AUTH_KEY,
                    "Content-Type": "application/json",
                },
            }
        );
        return response.data; // Return the response data
    } catch (error) {
        throw new Error(error?.response?.data?.msg || "An error occurred");
    }
};

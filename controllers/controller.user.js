import User from '../models/model.user.js';
import AadhaarDetails from '../models/model.aadaharDetails.js';
import asyncHandler from '../middleware/asyncHandler.js';
import { generateAadhaarOtp, verifyAadhaarOtp } from '../utils/aadhar.js';
import { generateToken } from '../utils/generateToken.js';
import generateRandomNumber from '../utils/generateRandomNumber.js';
import { panVerify } from "../utils/pan.js";
import { otpSent } from '../utils/smsGateway.js';
import OTP from '../models/model.otp.js';
import { uploadFilesToS3, deleteFilesFromS3 } from '../config/uploadFilesToS3.js';
import LoanApplication from '../models/model.loanApplication.js';
import PanDetails from '../models/model.panDetails.js';


const aadhaarOtp = asyncHandler(async (req, res) => {

    const { aadhaar } = req.params;
    // Validate Aaadhaar number (12 digits)
    if (!/^\d{12}$/.test(aadhaar)) {
        return res.status(400).json({
            success: false,
            message: "Aaadhaar number must be a 12-digit number.",
        });
    }

    // check if aadhar is already registered then send OTP by SMS gateway
    const userDetails = await User.findOne({ aadarNumber: aadhaar })
    if (userDetails) {
        if (userDetails.personalDetails && userDetails.personalDetails.mobile) {
            const mobile = userDetails.personalDetails.mobile
            const otp = generateRandomNumber();
            const result = await otpSent(mobile, otp);

            if (result.data.ErrorMessage === "Success") {
                // Update or create the OTP record for the mobile number
                await OTP.findOneAndUpdate(
                    { mobile },
                    { otp },
                    { upsert: true, new: true }
                );

                return res.status(200).json({ success: true, isAlreadyRegisterdUser:true,mobileNumber:mobile, message: "OTP sent successfully to your register mobile number"});
            }

            return res
                .status(500)
                .json({ success: false, message: "Failed to send OTP" });

        }
    }


    // Call the function to generate OTP using Aaadhaar number
    const response = await generateAadhaarOtp(aadhaar);
    // res.render('otpRequest',);

    return res.json({
        success: true,
        message:"OTP sent successfully to your Adhaar linked mobile number",
        isAlreadyRegisterdUser:true,
        transactionId: response.data.model.transactionId,
        fwdp: response.data.model.fwdp,
        codeVerifier: response.data.model.codeVerifier,
    });
});

const saveAadhaarDetails = asyncHandler(async (req, res) => {
    const { otp, transactionId, fwdp, codeVerifier } = req.body;

    // Check if both OTP and request ID are provided
    if (!otp || !transactionId || !fwdp || !codeVerifier) {
        res.status(400);
        throw new Error("Missing fields.");
    }

    // Fetch Aaadhaar details using the provided OTP and request ID
    const response = await verifyAadhaarOtp(
        otp,
        transactionId,
        fwdp,
        codeVerifier
    );

    // Check if the response status code is 422 which is for failed verification
    if (response.code === "200") {
        const details = response.model;
        const name = details.name.split(" ");
        const aadhaarNumber = details.adharNumber.slice(-4);
        const uniqueId = `${name[0].toLowerCase()}${aadhaarNumber}`;

        const existingAadhaar = await AadhaarDetails.findOne({
            uniqueId: uniqueId,
        });

        if (existingAadhaar) {
            const UserData = await User.findOneAndUpdate({ aadarNumber: details.adharNumber },
                { registrationStatus: "AADAR_VERIFIED" },
                { new: true }
            );
            const token = generateToken(res, UserData._id)
            console.log("token--->", token)
            return res.json({
                success: true,
                token: token,
            });
        }

        const userDetails = await User.create({
            aadarNumber: details.adharNumber,
            "personalDetails.fullName": details.name,
            "personalDetails.dob": details.dob,
            "personalDetails.gender": details.gender,
            registrationStatus: "AADAR_VERIFIED",
        }
        );

        // Save Aaadhaar details in AadharDetails model
        await AadhaarDetails.create({
            uniqueId,
            details,
        });

        // generate token 
        const token = generateToken(res, userDetails._id)
        console.log("token---->", token)
        // Respond with a success message
        return res.json({
            success: true,
            token: token
        });
    }
    const code = parseInt(response.code, 10);
    res.status(code);
    throw new Error(response.msg);
});


const mobileGetOtp = asyncHandler(async (req, res) => {
    const { mobile } = req.params;
    if (!mobile) {
        return res.status(400).json({ message: "Mobile number is required" });
    }

    const indianMobileNumberRegex = /^[6-9]\d{9}$/;
    if (!indianMobileNumberRegex.test(mobile)) {
        return res.status(400).json({ message: "Mobile number is not formated" });

    }

    const otp = generateRandomNumber();
    const result = await otpSent(mobile, otp);

    if (result.data.ErrorMessage === "Success") {
        // Update or create the OTP record for the mobile number
        await OTP.findOneAndUpdate(
            { mobile },
            { otp },
            { upsert: true, new: true }
        );

        return res.status(200).json({ success: true, message: "OTP sent successfully!!" });
    }

    return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP" });
});


const verifyOtp = asyncHandler(async (req, res) => {
    const { mobile, otp , isAlreadyRegisterdUser} = req.body;
    console.log(req.user._id, "req.user._id")

    // Check if both mobile and OTP are provided
    if (!mobile && !otp) {
        return res.status(400).json({
            success: false,
            message: "Mobile number and OTP are required.",
        });
    }

    // Find the OTP record in the database
    const otpRecord = await OTP.findOne({ mobile: mobile });
    console.log(otpRecord, "otpRecord")

    // Check if the record exists
    if (!otpRecord) {
        return res.status(404).json({
            success: false,
            message:
                "No OTP found for this mobile number. Please request a new OTP.",
        });
    }

    // Verify if the provided OTP matches the stored OTP
    if (otpRecord.otp !== otp) {
        return res.status(401).json({
            success: false,
            message: "Invalid OTP. Please try again.",
        });
    }

    const otpAge = Date.now() - new Date(otpRecord.updatedAt).getTime();
    if (otpAge > 10 * 60 * 1000) {
        return res.status(400).json({
            success: false,
            message: "OTP has expired. Please request a new OTP.",
        });
    }

    otpRecord.otp = "";
    await otpRecord.save(); // Save the updated OTP record

    if(isAlreadyRegisterdUser){
       const userDetails = await User.findOne({mobile})
       const token = generateToken(res, userDetails._id)
        console.log("token---->", token)
        // Respond with a success message
        return res.json({
            success: true,
            message:"User login sucessfully!",
            token: token
        });
    }
   
    // update in user model
    const result = await User.findByIdAndUpdate(
        req.user._id,
        { registrationStatus: "MOBILE_VERIFIED", "personalDetails.mobile": mobile },
        { new: true }
    );
    console.log(result, "result")

    // OTP matches, verification successful
    return res.status(200).json({
        success: true,
        message: "OTP verified successfully!",
    });
});


const verifyPan = asyncHandler(async (req, res) => {

    const { pan } = req.params;
    const userId = req.user._id
    console.log(userId, "userId")

    // Validate that aaadhaar is present in the leads
    if (!pan) {
        res.status(400);
        throw new Error({ success: false, message: "Pan number is required." });
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    // Validate the PAN number
    if (!panRegex.test(pan)) {
        res.status(400);
        throw new Error({ success: false, message: "Invalid PAN!!!" });
    }

    // Call the get panDetails Function
    const response = await panVerify(userId, pan);

    if (response.result_code !== 101) {
        res.status(400);
        throw new Error("Error with Digitap!");
    }

    // update in user table 
    await User.findByIdAndUpdate(
        userId,
        { registrationStatus: "PAN_VERIFIED", PAN: pan },
        { new: true }
    );

    // add pan details in panDetails table
    await PanDetails.findOneAndUpdate(
        {
            $or: [
                { "data.PAN": pan }, // Check if data.PAN matches
                { "data.pan": pan }, // Check if data.pan matches
            ],
        },
        { data:response.result }, // Update data
        { upsert: true, new: true } // Create a new record if not found
    );


    // Now respond with status 200 with JSON success true
    return res.status(200).json({
        data: response.result,
    });

})


const personalInfo = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const personalDetails = req.body;
    if (!personalDetails) {
        return res.status(400).json({ message: "Personal details are required" });
    }
    if (personalDetails.personalEmail) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(personalDetails.personalEmail)) {
            return res.status(400).json({ message: "Email should be in correct format" });
        }
    }

    const userDetails = await User.findById(userId);

    if (!userDetails) {
        console.log({ message: "User not found" });
        return res.status(404).json({ message: "User not found" });
    }


    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            personalDetails,
            registrationStatus: "PERSONAL_DETAILS"

        },
        { new: true }
    );

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Personal details updated successfully", user: updatedUser.personalDetails });

});

const currentResidence = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const residenceDetails = req.body;

    const userDetails = await User.findById(userId);

    if (!userDetails) {
        console.log({ message: "User not found" });
        return res.status(404).json({ message: "User not found" });
    }

    // Merge the new details with existing ones


    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                residenceDetails,
                registrationStatus: "CURRENT_RESIDENCE"
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Personal details updated successfully", residenceDetails: updatedUser.residenceDetails });

})

const addIncomeDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const incomeDetails = req.body;

    const [day, month, year] = incomeDetails.nextSalaryDate.split("-").map(Number);
    const validDate = new Date(year, month - 1, day);
    console.log("validDate", validDate);
    incomeDetails.nextSalaryDate = validDate;

    const userDetails = await User.findById(userId);

    if (!userDetails) {
        console.log({ message: "User not found" });
        return res.status(404).json({ message: "User not found" });
    }


    const updatedUser = await
        User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    incomeDetails,
                    registrationStatus: "INCOME_DETAILS"
                }
            },
            { new: true }
        );

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Income details updated successfully", incomeDetails: updatedUser.incomeDetails });
})

const uploadProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!req.files || !req.files.profilePicture) {
        res.status(400);
        return res.json({ message: "No profile picture uploaded" });
    }

    const profilePictureFile = req.files.profilePicture[0];

    // Check if the file is an image
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const fileMimeType = profilePictureFile.mimetype;

    if (!allowedMimeTypes.includes(fileMimeType)) {
        return res.status(400).json({ message: "Uploaded file is not an image. Please upload an image file." });
    }

    const fileBuffer = profilePictureFile.buffer;
    const fileName = `users/${userId}/profile-picture-${Date.now()}.${profilePictureFile.mimetype.split("/")[1]}`;

    const user = await User.findById(userId);

    if (!user) {
        console.log({ message: "User not found" });
        return res.status(404).json({ message: "User not found" });
    }

    // If the user already has a profile picture, delete the old one from S3
    if (user.profileImage) {
        const oldKey = user.profileImage.split("/").slice(-1)[0];
        console.log("oldKey", oldKey);
        await deleteFilesFromS3(`users/${userId}/${oldKey}`);
    }

    // Upload the new profile picture to S3
    const uploadResult = await uploadFilesToS3(fileBuffer, fileName);

    // Save the profile image URL and update the user's status
    user.profileImage = uploadResult.Location;
    user.registrationStatus = "UPLOAD_PROFILE";
    user.isCompleteRegistration = true;
    await user.save();

    // Return the response
    return res.status(200).json({
        message: "Profile picture uploaded successfully",
        profileImageUrl: user.profileImage,
    });
});

const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const data = {
        profileImage: user.profileImage,
        name: user.personalDetails.fullName
    }

    res.status(200).json({
        success: true,
        data

    })
})

const getProfileDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const data = {
        personalDetails: user.personalDetails,
        residence: user.residenceDetails,
        incomeDetails: user.incomeDetails,
        profileImage: user.profileImage,

    }
    return res.status(200).json({
        success: true,
        data
    })
})

const getDashboardDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // If the registration is incomplete, return the registration status
    if (!user.isCompleteRegistration) {
        return res.status(200).json({
            success: true,
            message: "Registration incomplete",
            isRegistration: true,
            registrationStatus: user.registrationStatus,
        });
    }

    // If the registration is complete, fetch the loan application status
    const loanApplication = await LoanApplication.findOne({ userId })

    if (!loanApplication) {
        return res.status(200).json({
            success: true,
            message: "No loan application found",
        });
    }

    // Return the application status and progress phase
    return res.status(200).json({
        success: true,
        message: "Application status fetched successfully",
        isRegistration: false,
        applicationStatus: loanApplication.applicationStatus,
        progressStatus: loanApplication.progressStatus,
    });
});


const checkLoanElegblity = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (!user.isCompleteRegistration) {
        return res.status(200).json({ message: "Please Complete Profile First", isElegble: user.isCompleteRegistration });
    }

    const alredyApplied = await LoanApplication.findOne({ userId });
    if (alredyApplied && alredyApplied.status === "PENDING") {
        return res.status(200).json({ message: "You have already applied for loan", isEligible: false });
    }

    return res.status(200).json({ message: "You are eligible for loan", isEligible: true });

})


export { aadhaarOtp, saveAadhaarDetails, mobileGetOtp, verifyPan, getProfile, personalInfo, currentResidence, addIncomeDetails, uploadProfile, getProfileDetails, getDashboardDetails, checkLoanElegblity, verifyOtp }
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


const aadhaarOtp = asyncHandler(async (req, res) => {

    const { aadhaar } = req.params;
    // Validate Aaadhaar number (12 digits)
    if (!/^\d{12}$/.test(aadhaar)) {
        return res.status(400).json({
            success: false,
            message: "Aaadhaar number must be a 12-digit number.",
        });
    }

    // Call the function to generate OTP using Aaadhaar number
    const response = await generateAadhaarOtp(aadhaar);
    // res.render('otpRequest',);

    res.json({
        success: true,
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
        console.log("aadhaar details --->" , details);    
        const name = details.name.split(" ");
        const aadhaarNumber = details.adharNumber.slice(-4);
        const uniqueId = `${name[0].toLowerCase()}${aadhaarNumber}`;

        const existingAadhaar = await AadhaarDetails.findOne({
            uniqueId: uniqueId,
        });

        if (existingAadhaar) {
            await User.findOneAndUpdate({ aadarNumber: details.adharNumber },
                { isAadhaarDetailsSaved: true },
                { new: true }
            );
            return res.json({
                success: true,
                details,
            });
        }

        const userDetails = await User.create({
            aadarNumber: details.adharNumber,
            "personalDetails.fullName": details.name,
            "personalDetails.dob": details.dob,
            "personalDetails.gender": details.gender,
            isAadhaarDetailsSaved: true,
        }
        );

        // Save Aaadhaar details in AadharDetails model
        await AadhaarDetails.create({
            uniqueId,
            details,
        });

        // generate token 
        const token = generateToken(res, userDetails._id)
        // Respond with a success message
        return res.json({
            success: true,
            details,
            token: token
        });
    }
    const code = parseInt(response.code, 10);
    res.status(code);
    throw new Error(response.msg);

    // // Check if the response status code is 422 which is for failed verification
    // if (!response.success) {
    //     res.status(response.response_code);
    //     throw new Error(response.response_message);
    // }

    // const details = response.result;
    // // Respond with a success message
    // return res.json({
    //     success: true,
    //     details,
    // });
});


const mobileGetOtp = asyncHandler(async (req, res) => {
    const { mobile } = req.body;

    const indianMobileNumberRegex = /^[6-9]\d{9}$/;
    if (!indianMobileNumberRegex.test(mobile)) {
        res.status(400);
        throw new Error("Invalid Indian mobile number");
    }

    // Generate a new random OTP
    const otp = generateRandomNumber();

    // Send OTP via the OTP service
    const result = await otpSent(mobile, otp);

    if (result.data.ErrorMessage === "Success") {
        // Update or create the OTP record for the mobile number
        await OTP.findOneAndUpdate(
            { mobile }, // Search by mobile number
            { fName, lName, otp, createdAt: Date.now() }, // Update data
            { upsert: true, new: true } // Create a new record if not found
        );

        return res.json({ success: true, message: "OTP sent successfully!!" });
    }

    return res
        .status(500)
        .json({ success: false, message: "Failed to send OTP" });
});


export const verifyOtp = asyncHandler(async (req, res) => {
    const { mobile, otp } = req.body;

    // Check if both mobile and OTP are provided
    if (!mobile && !otp) {
        return res.status(400).json({
            success: false,
            message: "Mobile number and OTP are required.",
        });
    }

    // Find the OTP record in the database
    const otpRecord = await OTP.findOne({ mobile });

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

    // update in user model
    await User.findByIdAndUpdate(
        req.user._id,
        { isMobileVerified: true, "personalDetails.mobile": mobile },
        { new: true }
    );

    // OTP matches, verification successful
    return res.json({
        success: true,
        message: "OTP verified successfully!",
    });
});


const verifyPan = asyncHandler(async (req, res) => {

    const { pan } = req.params;
    const id = req.user._id
    console.log(id, "userId")

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
    const response = await panVerify(id, pan);

    if (response.result_code !== 101) {
        res.status(400);
        throw new Error("Error with Digitap!");
    }

    // update in user table 
    await User.findByIdAndUpdate(
        id,
        { isPanVerified: true, PAN: pan },
        { new: true }
    );

    // add pan details in panDetails table



    // Now respond with status 200 with JSON success true
    return res.json({
        data: response.result,
    });

})


const personalInfo = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { personalDetails } = req.body;


    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                personalDetails,
                isPersonalDetailsSave: true
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Personal details updated successfully", user: updatedUser });

});

const currentResidence = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { residence } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                residence,
                isSaveAddress: true
            }
        },
        { new: true }
    );

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Personal details updated successfully", user: updatedUser });

})

const addIncomeDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { incomeDetails } = req.body;

    const updatedUser = await
        User.findByIdAndUpdate(
            userId,
            {
                $set: {
                    incomeDetails,
                    isSaveIncomedetails: true
                }
            },
            { new: true }
        );

    if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Income details updated successfully", user: updatedUser });
})

const uploadProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!req.files) {
        res.status(400);
        throw new Error("No files uploaded");
    }

    const profilePictureUpload = req.files.profilePicture && req.files.profilePicture.length > 0;

    if (profilePictureUpload) {
        return res.status(400).json({
            message:
                "You cannot upload both aadhaar documents and eAadhaar.",
        });
    }
    const fileBuffer = profilePictureFile.buffer;
    const fileName = `users/${userId}/profile-picture-${Date.now()}.${profilePictureFile.mimetype.split("/")[1]}`;


    // Find the user
    const user = await User.findById(userId);
    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    // If the user already has a profile picture, delete the old one from S3
    if (user.profileImage) {
        const oldKey = user.profileImage.split("/").slice(-1)[0]; // Extract S3 key from the URL
        await deleteFilesFromS3(`users/${userId}/${oldKey}`);
    }

    const uploadResult = await uploadFilesToS3(fileBuffer, fileName);

    user.profileImage = uploadResult.Location;
    user.isUploadProfile = true;
    await user.save();

    res.status(200).json({
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

    res.json({
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

    const data  = {
        personalDetails: user.personalDetails,
        residence: user.residence,
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

    const data = {
       
    }
    return res.status(200).json({
        success: true,
        data
    })
})

export { aadhaarOtp, saveAadhaarDetails, mobileGetOtp, verifyPan, getProfile, personalInfo, currentResidence, addIncomeDetails, uploadProfile, getProfileDetails, getDashboardDetails }
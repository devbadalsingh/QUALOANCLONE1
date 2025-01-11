import express from "express";
import { aadhaarOtp , saveAadhaarDetails, personalInfo ,currentResidence ,addIncomeDetails,uploadProfile, getProfile , getProfileDetails, getDashboardDetails, checkLoanElegblity , logout} from "../controllers/controller.user.js";  
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";
const router = express.Router();
const uploadFields = upload.fields([
    { name: "profilePicture", maxCount: 1 },
]);


// login with aadhar
router.route("/aadhaar-login/:aadhaar").get(aadhaarOtp);     
router.post("/submit-aadhaar-otp", saveAadhaarDetails);    

// Profile APIs    
router.patch("/personalInfo", authMiddleware , personalInfo);  
router.patch("/currentResidence", authMiddleware , currentResidence);  
router.patch("/addIncomeDetails", authMiddleware , addIncomeDetails);   
router.patch("/uploadProfile", authMiddleware ,uploadFields, uploadProfile);   

// Dashboard APIs
router.get("/getProfile" , authMiddleware ,getProfile);   
router.get("/getProfileDetails" , authMiddleware ,getProfileDetails);  
router.get("/getDashboardDetails" , authMiddleware ,getDashboardDetails);  
router.get("/checkLoanElegblity" , authMiddleware ,checkLoanElegblity); 

// logout
router.post("/logout" , authMiddleware , logout)


export default router;
import express from "express";
import {verifyOtp , mobileGetOtp , verifyPan} from "../controllers/controller.user.js";  
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();


router.post("/mobile/get-otp",authMiddleware, mobileGetOtp);  
router.post("/mobile/verify-otp",authMiddleware, verifyOtp);  
router.post("/panVerify",authMiddleware, verifyPan);  

export default router;
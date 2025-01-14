import express from "express";
import {verifyOtp , mobileGetOtp , verifyPan} from "../controllers/controller.user.js";  
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();


router.post("/mobile/get-otp/:mobile", authMiddleware, mobileGetOtp);
router.post("/mobile/verify-otp", verifyOtp);    
router.post("/verifyPAN/:pan",authMiddleware, verifyPan);  

export default router;
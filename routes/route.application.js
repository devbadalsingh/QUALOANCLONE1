import express from "express";
import {calculateLoan} from "../controllers/controller.application.js";  
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();


router.post("/calculateLoan",authMiddleware, calculateLoan);  
router.patch("/addEmploymentInfo",authMiddleware, addEmploymentInfo);


export default router;
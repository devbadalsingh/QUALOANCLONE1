import express from "express";
import {calculateLoan,addEmploymentInfo,uploadBankStatement,uploadDocuments,disbursalBankDetails,getApplicationStatus,getApplicationDetails} from "../controllers/controller.loanApplication.js";  
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";
const router = express.Router();
const uploadFields = upload.fields([
    { name: "bankStatement", maxCount: 1 },
    {name:"documents",maxCount:5}
]);


// LoanApplication APIs
router.post("/calculateLoan",authMiddleware, calculateLoan);
router.patch("/addEmploymentInfo",authMiddleware, addEmploymentInfo);
router.patch("/uploadBankStatement",authMiddleware,uploadFields, uploadBankStatement);
router.patch("/uploadDocuments",authMiddleware,uploadFields, uploadDocuments); 
router.patch("/disbursalBankDetails",authMiddleware, disbursalBankDetails);   
router.get("/getApplicationStatus",authMiddleware, getApplicationStatus);
router.get("/getApplicationDetails", authMiddleware, getApplicationDetails);


export default router;
import express from "express";
import { calculateLoan, addEmploymentInfo, getApplicationStatus, getApplicationDetails, disbursalBankDetails , getDocumentStatus , getDocumentList , documentPreview, getJourney} from "../controllers/controller.loanApplication.js";
import { uploadDocuments } from "../controllers/docsUpload.js"
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../config/multer.js";
const router = express.Router();

const uploadFields = upload.fields([
    { name: "aadhaarFront", maxCount: 1 },
    { name: "aadhaarBack", maxCount: 1 },
    { name: "eAadhaar", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "residential", maxCount: 1 },
    { name: "electricityBill", maxCount: 1 },
    { name: "gasConnection", maxCount: 1 },
    { name: "bankStatement", maxCount: 10 },
    { name: "salarySlip", maxCount: 10 },
    { name: "others", maxCount: 10 },
]);


// LoanApplication APIs
router.post("/applyLoan", authMiddleware, calculateLoan);
router.patch("/addEmploymentInfo", authMiddleware, addEmploymentInfo);
router.patch("/uploadDocuments", authMiddleware, uploadFields, uploadDocuments);
router.patch("/disbursalBankDetails", authMiddleware, disbursalBankDetails);
router.get("/getApplicationStatus", authMiddleware, getApplicationStatus);
router.get("/getApplicationDetails", authMiddleware, getApplicationDetails);
router.get("/getDocumentStatus" , authMiddleware , getDocumentStatus)
router.get("/getDocumentList" , authMiddleware , getDocumentList)
router.get("/documentPreview", authMiddleware ,documentPreview)
router.get("/getJourney" , authMiddleware , getJourney)


export default router;
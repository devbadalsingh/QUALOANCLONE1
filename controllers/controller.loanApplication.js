import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/model.user.js';
import LoanApplication from '../models/model.loanApplication.js';



const calculateLoan = asyncHandler(async (req, res) => {
    const loanDetails = req.body;
    const { principal, EMI, totalPayble, intrestPerMonth, processingFee, tenureMonth } = loanDetails;

    if (
        principal <= 0 ||
        EMI <= 0 ||
        totalPayble <= 0 ||
        intrestPerMonth <= 0 ||
        processingFee <= 0 ||
        tenureMonth <= 0
    ) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(400).json({ message: "Invalid input" });
    }
    const loanApplication = await LoanApplication.create({
        userId: user._id,
        loanDetails
    });

    if (!loanApplication) {
        return res.status(400).json({ message: "Loan Application not created" });
    }

    return res.status(200).json({ message: "Loan Application created successfully" });

});


const addEmploymentInfo = asyncHandler(async (req, res) => {
    const employeInfo = req.body;
    const userId = req.user._id;
    if (!employeInfo || !userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const loanDetails = LoanApplication.findOne({ userId: userId });
    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    const addEmploymentInfo = await LoanApplication.findOneAndUpdate(
        { userId: userId },
        {
            $set: {
                employeeDetails: employeInfo,
                progressStatus: "EMPLOYMENT_DETAILS_SAVED"
            }
        },

        {
            new: true

        }
    );

    if (!addEmploymentInfo) {
        return res.status(400).json({ message: "Employment Info not added" });
    }
    return res.status(200).json({ message: "Employment Info added successfully" });
});

// Pending
const uploadBankStatement = asyncHandler(async (req, res) => { });

// Pending
const uploadDocuments = asyncHandler(async (req, res) => { });


const disbursalBankDetails = asyncHandler(async (req, res) => {
    const bankDetails = req.body;
    const userId = req.user._id;
    if (!bankDetails || !userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const loanDetails = LoanApplication.findOne({ userId: userId });
    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    const addBankDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId },
        {
            $set: {
                disbursalBankDetails: bankDetails,
                progressStatus: "DISBURSAL_DETAILS_SAVED"
            }
        },

        {
            new: true

        }
    );

    if (!addBankDetails) {
        return res.status(400).json({ message: "Bank Details not added" });
    }
    return res.status(200).json({ message: "Bank Details added successfully" });
});


const getApplicationStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const loanDetails = LoanApplication.findOne({ userId: userId });
    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    return res.status(200).json({ message: "Loan Application found", applicationStatus: loanDetails.applicationStatus, progressStatus: loanDetails.progressStatus });
});


const getApplicationDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { applicationStatus } = req.query;
    console.log(applicationStatus, "<--applicationStatus");

    if (!userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const loanApplicationDetails = LoanApplication.findOne({ userId });
    if (!loanApplicationDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    let data;

    if (applicationStatus == "loanDetails") {
        data = loanApplicationDetails.loanDetails
    }

    if (applicationStatus == "employeeDetails") {
        data = loanApplicationDetails.employeeDetails
    }

    if (applicationStatus == "disbursalBankDetails") {
        data = loanApplicationDetails.disbursalBankDetails
    }

    return res.status(200).json({ message: "sucessfully fetched", data });

});



export { calculateLoan, addEmploymentInfo, uploadBankStatement, uploadDocuments, disbursalBankDetails, getApplicationStatus, getApplicationDetails }
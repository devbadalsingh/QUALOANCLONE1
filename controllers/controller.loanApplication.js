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
        return res.status(400).json({ message: "User not found" });
    }

    if(!user.isCompleteRegistration){
        return res.status(400).json({message:"firstly please complete your registration"})
    }

    let previousLoanApplication = await LoanApplication.findOne({ userId: user._id });

    if (previousLoanApplication && previousLoanApplication.applicationStatus=="PENDING"){
        loanApplication.loanDetails = loanDetails;
        await previousLoanApplication.save();
        return res.status(200).json({ message: "Loan Application updated successfully" });
    }

    const loanApplication = await LoanApplication.create({
        userId: user._id,
        loanDetails
    });

    if (!loanApplication) {
        return res.status(400).json({ message: "Loan Application not created" });
    }

    return res.status(200).json({ message: "Loan Application created successfully" , loanApplication : loanApplication.loanDetails});

});

const addEmploymentInfo = asyncHandler(async (req, res) => {
    const employeInfo = req.body;
    const userId = req.user._id;
    if (!employeInfo || !userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    // Validation for employment information
    const requiredFields = [
        "workFrom",
        "officeEmail",
        "companyName",
        "companyType",
        "designation",
        "officeAddrress_Line_1",
        "city",
        "state",
        "pincode"
    ];

    const missingFields = requiredFields.filter((field) => !employeInfo[field] || employeInfo[field].trim() === "");

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: "Missing or empty required fields",
            missingFields,
        });
    }

    const loanDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId , applicationStatus:"PENDING" }
    )

    if(!loanDetails){
        return res.status(400).json({message:"Loan Application not found"})
    }

    let progressStatus
    let previousJourney
    if(loanDetails.progressStatus=="CALCULATED"){
        progressStatus = "EMPLOYMENT_DETAILS_SAVED",
        previousJourney = "CALCULATED"
    }

    if(loanDetails.progressStatus!="CALCULATED"){
        progressStatus = loanDetails.progressStatus,
        previousJourney = loanDetails.previousJourney
    }


    const addEmploymentInfo = await LoanApplication.findOneAndUpdate(
        { userId: userId , applicationStatus:"PENDING" },
        {
            $set: {
                employeeDetails: employeInfo,
                progressStatus: progressStatus,
                previousJourney: previousJourney
            }
        },

        {
            new: true

        }
    );

    if (!addEmploymentInfo) {
        return res.status(400).json({ message: "Employment Info not added" });
    }
    return res.status(200).json({ message: "Employment Info added successfully" , EmploymentInfo :addEmploymentInfo.employeeDetails });
});

const disbursalBankDetails = asyncHandler(async (req, res) => {
    const bankDetails = req.body;
    const userId = req.user._id;
    if (!bankDetails || !userId) {
        return res.status(400).json({ message: "Invalid input" });
    }


    const loanDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId , applicationStatus:"PENDING" }
    )

    if(!loanDetails){
        return res.status(400).json({message:"Loan Application not found"})
    }

    let progressStatus
    let previousJourney
    if(loanDetails.progressStatus=="DOCUMENTS_SAVED"){
        progressStatus = "COMPLETED",
        previousJourney = "DISBURSAL_DETAILS_SAVED"
    }

    if(loanDetails.progressStatus!="DOCUMENTS_SAVED"){
        progressStatus = loanDetails.progressStatus,
        previousJourney = loanDetails.previousJourney
    }


    const addBankDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId },
        {
            $set: {
                disbursalBankDetails: bankDetails,
                progressStatus: progressStatus,
                previousJourney: previousJourney

            }
        },

        {
            new: true

        }
    );

    if (!addBankDetails) {
        return res.status(400).json({ message: "Bank Details not added" });
    }
    return res.status(200).json({ message: "Bank Details added successfully"  , bankDetails : addBankDetails.disbursalBankDetails});
});

const getApplicationStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
   
    const user = await User.findById(userId)
    if(!user){
        return res.status(400).json({ message: "User not found" });
    }

    const loanDetails = await LoanApplication.findOne({ userId: userId , applicationStatus:"PENDING" });
    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    return res.status(200).json({ message: "Loan Application found", applicationStatus: loanDetails.applicationStatus, progressStatus: loanDetails.progressStatus });
});

const getApplicationDetails = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { applicationStatus } = req.query;
   
    if (!userId) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const loanApplicationDetails = await LoanApplication.findOne({ userId , applicationStatus:"PENDING" });
    if (!loanApplicationDetails) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    let data;

    if (applicationStatus == "loanDetails") {
        data = loanApplicationDetails.loanDetails
        return res.status(200).json({ message: "sucessfully fetched", data });
    }

    if (applicationStatus == "employeeDetails") {
        data = loanApplicationDetails.employeeDetails
        return res.status(200).json({ message: "sucessfully fetched", data });
    }

    if (applicationStatus == "disbursalBankDetails") {
        data = loanApplicationDetails.disbursalBankDetails
        return res.status(200).json({ message: "sucessfully fetched", data });
    }

    data = loanApplicationDetails
    return res.status(200).json({ message: "sucessfully fetched", data });

});


export { calculateLoan, addEmploymentInfo, getApplicationStatus, getApplicationDetails , disbursalBankDetails }
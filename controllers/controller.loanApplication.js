import asyncHandler from '../middleware/asyncHandler.js';
import User from '../models/model.user.js';
import LoanApplication from '../models/model.loanApplication.js';
import Documents from '../models/model.document.js';
import { getDocs } from "../utils/docsUploadAndFetch.js"
import UserStatus from '../models/model.userStatus.js';




const calculateLoan = asyncHandler(async (req, res) => {
    const loanDetails = req.body;
    const { principal, totalPayble, intrestPerMonth, tenureMonth } = loanDetails;

    if (
        principal <= 0 ||
        totalPayble <= 0 ||
        intrestPerMonth <= 0 ||
        tenureMonth <= 0
    ) {
        return res.status(400).json({ message: "Invalid input" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    if (!user.isCompleteRegistration) {
        return res.status(400).json({ message: "firstly please complete your registration" })
    }

    let previousLoanApplication = await LoanApplication.findOne({ userId: user._id });

    if (previousLoanApplication && previousLoanApplication.applicationStatus == "PENDING") {
        previousLoanApplication.loanDetails = loanDetails;
        await previousLoanApplication.save();
        return res.status(200).json({ message: "Loan Application updated successfully" });
    }

    let loanApplication;
    const isLoanAlreadyCalculated = await LoanApplication.findOne({ userId: user._id })
    if (isLoanAlreadyCalculated) {
        isLoanAlreadyCalculated.loanDetails = loanDetails
        isLoanAlreadyCalculated.isLoanCalculated = true
        await isLoanAlreadyCalculated.save()

    }
    else {
        loanApplication = await LoanApplication.create({
            userId: user._id,
            isLoanCalculated: true,
            loanDetails
        });

    }

    if (!loanApplication) {
        return res.status(400).json({ message: "Loan Application not created" });
    }

    return res.status(200).json({ message: "Loan Application created successfully", loanApplication: loanApplication.loanDetails });

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
        "officeAddrress",
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
        { userId: userId, applicationStatus: "PENDING" }
    )

    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" })
    }

    let progressStatus
    let previousJourney
    if (loanDetails.progressStatus == "CALCULATED") {
        progressStatus = "EMPLOYMENT_DETAILS_SAVED",
            previousJourney = "CALCULATED"
    }

    if (loanDetails.progressStatus != "CALCULATED") {
        progressStatus = loanDetails.progressStatus,
            previousJourney = loanDetails.previousJourney
    }


    const addEmploymentInfo = await LoanApplication.findOneAndUpdate(
        { userId: userId, applicationStatus: "PENDING" },
        {
            $set: {
                employeeDetails: employeInfo,
                progressStatus: progressStatus,
                previousJourney: previousJourney,
                isEmploymentDetailsSaved: true
            }
        },

        {
            new: true

        }
    );

    if (!addEmploymentInfo) {
        return res.status(400).json({ message: "Employment Info not added" });
    }
    return res.status(200).json({ message: "Employment Info added successfully", EmploymentInfo: addEmploymentInfo.employeeDetails });
});

const disbursalBankDetails = asyncHandler(async (req, res) => {
    const bankDetails = req.body;
    const userId = req.user._id;
    if (!bankDetails || !userId) {
        return res.status(400).json({ message: "Invalid input" });
    }


    const loanDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId, applicationStatus: "PENDING" }
    )

    if (!loanDetails) {
        return res.status(400).json({ message: "Loan Application not found" })
    }

    let progressStatus
    let previousJourney
    if (loanDetails.progressStatus == "DOCUMENTS_SAVED") {
        progressStatus = "COMPLETED",
            previousJourney = "DISBURSAL_DETAILS_SAVED"
    }

    if (loanDetails.progressStatus != "DOCUMENTS_SAVED") {
        progressStatus = loanDetails.progressStatus,
            previousJourney = loanDetails.previousJourney
    }


    const addBankDetails = await LoanApplication.findOneAndUpdate(
        { userId: userId },
        {
            $set: {
                disbursalBankDetails: bankDetails,
                progressStatus: progressStatus,
                previousJourney: previousJourney,
                isDisbursalDetailsSaved: true
            }
        },

        {
            new: true

        }
    );

    if (!addBankDetails) {
        return res.status(400).json({ message: "Bank Details not added" });
    }
    return res.status(200).json({ message: "Bank Details added successfully", bankDetails: addBankDetails.disbursalBankDetails });
});

const getApplicationStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const user = await User.findById(userId)
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    const loanDetails = await LoanApplication.findOne({ userId: userId, applicationStatus: "PENDING" });
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

    const loanApplicationDetails = await LoanApplication.findOne({ userId, applicationStatus: "PENDING" });
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

const getDocumentStatus = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const userDetails = await User.findById(userId);
    const pan = userDetails.PAN;
    const data = await Documents.findOne({ pan: pan });

    // implementing aggregation pipeline

    // const pipeline = [
    //     {
    //       $match: {
    //         pan: pan
    //       }
    //     },
    //     {
    //       $project: {
    //         multipleDocumentsStatus: {
    //           $map: {
    //             input: {
    //               $objectToArray:
    //                 "$document.multipleDocuments"
    //             },
    //             as: "doc",
    //             in: {
    //               type: "$$doc.k",
    //               status: {
    //                 $cond: {
    //                   if: {
    //                     $gt: [
    //                       {
    //                         $size: "$$doc.v"
    //                       },
    //                       0
    //                     ]
    //                   },
    //                   then: "Uploaded",
    //                   else: "Not Uploaded"
    //                 }
    //               }
    //             }
    //           }
    //         },
    //         singleDocumentsStatus: {
    //           $map: {
    //             input: "$document.singleDocuments",
    //             as: "doc",
    //             in: {
    //               type: "$$doc.type",
    //               status: "Uploaded"
    //             }
    //           }
    //         }
    //       }
    //     }
    //   ]

    // const reults = await Documents.aggregate(pipeline); 

    const multipleDocs = data.document.multipleDocuments;
    const singleDocs = data.document.singleDocuments;

    // Check multiple documents
    const multipleDocumentsStatus = {};
    for (const [key, value] of Object.entries(multipleDocs)) {
        multipleDocumentsStatus[key] = value.length > 0 ? 'Uploaded' : 'Not Uploaded';
    }

    // Check single documents
    const singleDocumentsStatus = singleDocs.map(doc => ({
        type: doc.type,
        status: 'Uploaded',
    }));

    const response = {
        multipleDocumentsStatus,
        singleDocumentsStatus,
    };

    return res.status(200).json(response);

})

const getDocumentList = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Fetch user details to get PAN
    const userDetails = await User.findById(userId);
    if (!userDetails || !userDetails.PAN) {
        return res.status(404).json({ message: "User or PAN not found" });
    }

    // Find the documents by PAN
    const result = await Documents.findOne(
        { pan: userDetails.PAN }, // Match the document using the `pan` field
        {
            "document.singleDocuments": 1,
            "document.multipleDocuments": 1,
        }
    );

    if (result) {
        // Process `singleDocuments`
        const singleDocuments = result.document.singleDocuments.map(doc => ({
            id: doc._id || null, // Include `_id` if available
            name: doc.name,
            type: doc.type || null, // Handle cases where type might not exist
            url: doc.url || null, // Handle cases where url might not exist
        }));

        // Process `multipleDocuments`
        const multipleDocuments = [];
        const multipleDocs = result.document.multipleDocuments;
        for (const [key, docsArray] of Object.entries(multipleDocs)) {
            docsArray.forEach(doc => {
                multipleDocuments.push({
                    id: doc._id || null, // Include `_id` if available
                    name: doc.name,
                    type: key, // Use the key (e.g., bankStatement, salarySlip) as the type
                    url: doc.url || null, // Handle cases where url might not exist
                });
            });
        }

        // Combine both lists into one array
        const allDocuments = [...multipleDocuments, ...singleDocuments];

        return res.status(200).json({ documents: allDocuments });
    }

    // Return an empty array if no documents match the given PAN
    return res.status(200).json({ documents: [] });
})

const documentPreview = asyncHandler(async (req, res) => {

    const { docType } = req.query;
    const docId = req.query.docId;

    let userDetails = await User.findById(req.user._id);


    if (!userDetails) {
        res.status(404);
        throw new Error("Lead not found!!!");
    }
    const docs = await Documents.findOne({ pan: userDetails.PAN });
    console.log(docs);

    const result = await getDocs(docs, docType, docId);

    // Return the pre-signed URL for this specific document
    res.json({
        type: docType,
        url: result.preSignedUrl,
        mimeType: result.mimeType,
    });

})

const getJourney = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const journey = await UserStatus.findOne({ userId: userId });
    if (!journey) {
        return res.status(400).json({ message: "Loan Application not found" });
    }

    return res.status(200).json({ message: "Loan Application journey found", journey: journey })
});


export { calculateLoan, addEmploymentInfo, getApplicationStatus, getApplicationDetails, disbursalBankDetails, getDocumentStatus, getDocumentList, documentPreview, getJourney }
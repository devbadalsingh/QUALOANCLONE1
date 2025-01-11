import mongoose from "mongoose";


const employeeInfoSchema = new mongoose.Schema({
    workFrom: {
        type: String,
        required: true,
        enum: ['OFFICE', 'HOME']
    },
    officeEmail: {
        type: String,
    },
    companyName: {
        type: String,
        required: true,
    },
    companyType: {
        type: String,
        required: true,
    },
    designation: {
        type: String,
        required: true,
    },
    officeAddrress: {
        type: String,
        required: true,
    },
    landmark: {
        type: String,
    },
    city: {
        type: String,
        required: true,
    },
    state: {
        type: String,
        required: true,
    },
    pincode: {
        type: String,
        required: true,
    },

})

const disbursalBankSchema = new mongoose.Schema({
    bankName: {
        type: String,
        required: true,
    },
    accountNumber: {
        type: String,
        required: true,
    },
    ifscCode: {
        type: String,
        required: true,
    },
    accountType: {
        type: String,
        required: true,
        enum: ['SAVINGS', 'CURRENT']
    },
})

const loanDetailsSchema = new mongoose.Schema({
    principal: {
        type: Number,
        required: true
    },
    totalPayble: {
        type: Number,
        required: true
    },
    intrestPerMonth: {
        type: Number,
        required: true
    },
    tenureMonth: {
        type: Number,
        required: true
    },
    loanPurpose: {
        type: String,
        required: true,
        enum: ['TRAVEL', 'MEDICAL', 'ACADEMICS', 'OBLIGATIONS', 'FESTIVAL', 'PURCHASE', 'OTHERS']
    },
})

const applicationSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },

    loanDetails: loanDetailsSchema,
    employeeDetails: employeeInfoSchema,
    disbursalBankDetails :disbursalBankSchema,

    progressStatus: {
        type: String,
        default: "CALCULATED",
        enum: [
            "CALCULATED",
            "EMPLOYMENT_DETAILS_SAVED",
            "BANK_STATEMENT_FETCHED",
            "DOCUMENTS_SAVED",
            "DISBURSAL_DETAILS_SAVED",
            "COMPLETED",
        ],
    },

    previousJourney:{
        type: String,
        default: "CALCULATED",
        enum: [
            "CALCULATED",
            "EMPLOYMENT_DETAILS_SAVED",
            "BANK_STATEMENT_FETCHED",
            "DOCUMENTS_SAVED",
            "DISBURSAL_DETAILS_SAVED",
            "COMPLETED",
        ],
    },

    applicationStatus: {
        type: String,
        default: 'PENDING',
        enum: ['PENDING', 'APPROVED', 'REJECTED']
    }


});

const LoanApplication = mongoose.model("loanApplication", applicationSchema);

export default LoanApplication;

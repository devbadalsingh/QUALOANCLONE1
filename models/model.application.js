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
    officeAddrress_Line_1: {
        type: String,
        required: true,
    },
    officeAddrress_Line_2: {
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
const applicationSchema = new mongoose.Schema({

    userId:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },

    principal:{
        type: Number,
        required: true
    },
    EMI:{
        type: Number,
        required: true
    },
    totalPayble:{
        type: Number,
        required: true
    },
    intrestPerMonth:{
        type: Number,
        required: true
    },
    processingFee:{
        type: Number,
        required: true
    },
    tenureMonth:{
        type: Number,
        required: true
    },
    loanPurpose:{
        type: String,
        required: true,
        enum: ['TRAVEL', 'MEDICAL', 'ACADEMICS', 'OBLIGATIONS', 'FESTIVAL', 'PURCHASE', 'OTHERS']
    },

    employeeDetails: employeeInfoSchema,
    
    isLoanCalculate: {
        type: Boolean,
        default: true
    },
    isEmploymentDetailsSave: {
        type: Boolean,
        default: false
    },
    isfetchBankStatement: {
        type: Boolean,
        default: false
    },
    isDocumentionSave: {
        type: Boolean,
        default: false
    },
    isDisbursalDetailsSave: {
        type: Boolean,
        default: false
    },
    status:{
        type: String,
        default: 'PENDING',
        enum: ['PENDING', 'APPROVED', 'REJECTED']
    }


});

const Application = mongoose.model("Application", applicationSchema);

export default Application;

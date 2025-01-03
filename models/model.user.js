import mongoose from "mongoose";

const personalDetailsSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    gender: { type: String, required: true, enum: ["M", "F"] },
    dob: {
      type: String,
      required: true,
    },
    mobile: { type: String},
    personalEmail: {
      type: String,
    },
    spouseName: {
      type: String,
    }
  },
  { _id: false }
);


const residenceSchema = new mongoose.Schema({
  address_line_1: {
    type: String,
    required: true,
  },
  address_line_2: {
    type: String,

  },

  landmark: {
    type: String
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
  residenceType: {
    type: String,
    required: true,
    enum: ["OWNED", "RENTED", "PARENTAL", "COMPANY PROVIDED", "OTHERS"], 
  },
});

const incomeDetailsSchema = new mongoose.Schema({
  employementType: {
    type: String,
    required: true,
    enum: ["SALARIED", "SELF EMPLOYED"],
  },

  monthlyIncome: {
    type: Number,
    required: true,
  },  
  obligations: {
    type: Number,
  },
  nextSalaryDate: {
    type: Date,
    required: true,
  },  
  incomeMode:{
    type: String,
    required: true,
    enum: ["CASH", "BANK", "cheque"],
  }
});

// Define the schema
const userSchema = new mongoose.Schema(
  {
    aadarNumber: {
      type: String,
      required: true,
      unique: true,
    },


    PAN: {
      type: String,
    },
    profileImage: {
      type: String,
    },

    personalDetails: {
      type: personalDetailsSchema,
    },
    residence: {
      type: residenceSchema,
    },
    incomeDetails: {
      type: incomeDetailsSchema,
    },

    isAadhaarVerified: {
      type: Boolean,
      default: false,
    },
    isPersonalDetailsSave: {
      type: Boolean,
      default: false,
    },
    isPANVerified: {
      type: Boolean,
      default: false,
    },
    isSaveIncomedetails: {
      type: Boolean,
      default: false,
    },
    isSaveAddress: {
      type: Boolean,
      default: false
    },
    isUploadProfile: {
      type: Boolean,
      default: false,
    },
    isMobileVeried: {
      type: Boolean,
      default: false,
    },
    
    isCompleteRegistration:{
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    }

  },
  { timestamps: true }
);

// Compile the model
const User = mongoose.model("User", userSchema);

export default User;

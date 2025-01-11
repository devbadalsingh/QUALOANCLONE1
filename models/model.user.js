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
  address: {
    type: String,
    required: true,
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
    enum: ["CASH", "BANK", "CHEQUE", "OTHERS"],
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
    mobile: { type: String},

    personalDetails: {
      type: personalDetailsSchema,
    },
    residenceDetails: {
      type: residenceSchema,
    },
    incomeDetails: {
      type: incomeDetailsSchema,
    },

    registrationStatus: {
      type: String,
      enum: ["AADHAR_VERIFIED", "MOBILE_VERIFIED", "PAN_VERIFIED","PERSONAL_DETAILS", "CURRENT_RESIDENCE", "INCOME_DETAILS", "UPLOAD_PROFILE","COMPLETE_DETAILS"],
      default: "AADHAR_VERIFIED",
    },

    previousJourney:{
      type: String,
      enum: ["NEW" ,"AADHAR_VERIFIED", "MOBILE_VERIFIED", "PAN_VERIFIED","PERSONAL_DETAILS", "CURRENT_RESIDENCE", "INCOME_DETAILS", "UPLOAD_PROFILE","COMPLETE_DETAILS"],
      default: "NEW",
    },
    

    isCompleteRegistration:{
      type : Boolean,
      default : false
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    authToken:{
      type :String
    }

  },
  { timestamps: true }
);

// Compile the model
const User = mongoose.model("User", userSchema);

export default User;

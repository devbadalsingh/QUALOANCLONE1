import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    aadhar:{
        type : String,
    },
    mobile:{type:String,required:true},
    otp: { type: String},
    
},
{
    timestamps: true,
});

// Create a TTL index on the `expiresAt` field
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;


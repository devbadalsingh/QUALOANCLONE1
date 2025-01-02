import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    otp: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date, required: true },
});

// Create a TTL index on the `expiresAt` field
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;


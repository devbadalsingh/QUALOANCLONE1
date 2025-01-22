import mongoose from 'mongoose';

const userStatusSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User"
    },
    isScreeningCompleted: {

        type: Boolean,
        default: false
    },
    isSanctionCompleted: {
        type: Boolean,
        default: false

    },
    isDisbursalCompleted: {
        type: Boolean,
        default: false

    },
    isRepayCompleted: {
        type: Boolean,
        default: false

    },
    isLoanCompleted: {
        type: Boolean,
        default: false

    }

},
    {
        timestamps: true,
    });


const UserStatus = mongoose.model('UserStatus', userStatusSchema);

export default UserStatus;


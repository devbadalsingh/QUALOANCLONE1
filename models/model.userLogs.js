import mongoose from "mongoose";

const userLogHistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    logDate: {
        type: Date,
    },
    userRemark: {
        type: String,
    },
});

const UserLogHistory = new mongoose.model("UserLoghistory", userLogHistorySchema);
export default UserLogHistory;

import mongoose, { mongo } from "mongoose";

const panSchema = new mongoose.Schema(
    {
        data: {
            type: Object,
            require: true,
        },
    },
    { timestamps: true }
);

const PanDetails = mongoose.model("Pan", panSchema);
export default PanDetails;

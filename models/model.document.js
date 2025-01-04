import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
    pan: {
        type: String,
        unique: true,
        required: true,
    },
    document: {
        singleDocuments: [
            {
                name: {
                    type: String,
                    required: true,
                },
                type: {
                    type: String,
                    enum: [
                        "aadhaarFront",
                        "aadhaarBack",
                        "eAadhaar",
                        "panCard",
                        "cibilReport",
                        // "sanctionLetter",
                        // Add more document types as needed
                    ],
                },
                url: {
                    type: String,
                    required: true,
                },
                remarks: {
                    type: String,
                },
            },
        ],
        multipleDocuments: {
            bankStatement: [
                {
                    name: {
                        type: String,
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    remarks: {
                        type: String,
                    },
                },
            ],
            salarySlip: [
                {
                    name: {
                        type: String,
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    remarks: {
                        type: String,
                    },
                },
            ],
            sanctionLetter: [
                {
                    name: {
                        type: String,
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    remarks: {
                        type: String,
                    },
                }

            ],
            others: [
                {
                    name: {
                        type: String,
                        required: true,
                    },
                    url: {
                        type: String,
                        required: true,
                    },
                    remarks: {
                        type: String,
                    },
                },
            ],
        },
    },
});

const Documents = mongoose.model("Document", documentSchema);
export default Documents;

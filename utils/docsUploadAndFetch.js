import {
    uploadFilesToS3,
    deleteFilesFromS3,
} from "../config/uploadFilesToS3.js";
import Documents from "../models/model.document.js";

export const uploadDocs = async (docs, files, remarks) => {
    const singleDocUpdates = [];
    const multipleDocUpdates = {
        bankStatement: [],
        salarySlip: [],
        others: [],
    };

    // Process each field in `files`
    for (const fieldName in files) {
        const fileArray = files[fieldName];
        const isSingleType = [
            "aadhaarFront",
            "aadhaarBack",
            "eAadhaar",
            "panCard",
            "residential",
            "electricityBill",
            "gasConnection"
        ].includes(fieldName);

        if (isSingleType) {
            const file = fileArray[0]; // Single document: process only the first file
            const key = `${docs.pan}/${fieldName}-${Date.now()}-${file.originalname}`;
            console.log("key-->" , key)

            // Check if the document type already exists
            const existingDocIndex = docs.document.singleDocuments.findIndex(
                (doc) => doc.type === fieldName
            );

            if (existingDocIndex !== -1) {
                // Replace existing document
                const oldFileKey = docs.document.singleDocuments[existingDocIndex].url;
                if (oldFileKey) await deleteFilesFromS3(oldFileKey);

                const res = await uploadFilesToS3(file.buffer, key);
                docs.document.singleDocuments[existingDocIndex].url = res.Key;
                docs.document.singleDocuments[existingDocIndex].remarks = remarks || "";
            } else {
                // Add new single document
                const res = await uploadFilesToS3(file.buffer, key);
                singleDocUpdates.push({
                    name: fieldName,
                    type: fieldName,
                    url: res.Key,
                    remarks: remarks || "",
                });
            }
        } else {
            // Multiple documents: process all files for the field
            for (const [index, file] of fileArray.entries()) {
                const key = `${docs.pan}/${fieldName}/${fieldName}-${Date.now()}-${file.originalname}`;
                const fileRemark = Array.isArray(remarks) ? remarks[index] : remarks;
                const res = await uploadFilesToS3(file.buffer, key);
                multipleDocUpdates[fieldName].push({
                    name: `${fieldName}_${index + 1}`,
                    url: res.Key,
                    remarks: fileRemark || "",
                });
            }
        }
    }

    // Add updates for single documents
    if (singleDocUpdates.length > 0) {
        docs.document.singleDocuments.push(...singleDocUpdates);
    }

    // Add updates for multiple documents
    for (const [field, documents] of Object.entries(multipleDocUpdates)) {
        if (documents.length > 0) {
            docs.document.multipleDocuments[field] =
                docs.document.multipleDocuments[field] || [];
            docs.document.multipleDocuments[field].push(...documents);
        }
    }

    // Save the updated document
    const updatedDocs = await Documents.findByIdAndUpdate(
        docs._id,
        { document: docs.document },
        { new: true, runValidators: false }
    );

    if (!updatedDocs) {
        return { success: false };
    }

    return { success: true, updatedDocs };
};

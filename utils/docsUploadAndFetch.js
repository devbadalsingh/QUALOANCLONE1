import {
    uploadFilesToS3,
    deleteFilesFromS3,
    generatePresignedUrl,
} from "../config/uploadFilesToS3.js";
import getMimeTypeForDocType from "../utils/getMimeTypeForDocType.js";
import Lead from "../models/Leads.js";
import Documents from "../models/Documents.js";

export const uploadDocs = async (docs, files, remarks, options = {}) => {
    const { isBuffer = false, buffer, fieldName = "" } = options;

    // Prepare an array to store all upload promises
    // const uploadPromises = [];
    const singleDocUpdates = [];
    const multipleDocUpdates = {
        bankStatement: [],
        salarySlip: [],
        others: [],
    };

    if (isBuffer && fieldName) {
        // Handle buffer
        const key = `${docs.pan}/${fieldName}-${Date.now()}.pdf`;

        // Check if the document type already exists in the lead's document.singleDocument array
        const existingDocIndex = docs.document.singleDocuments.findIndex(
            (doc) => doc.type === fieldName
        );

        if (existingDocIndex !== -1) {
            // Delete the old file and upload the new file
            const oldFileKey =
                docs.document.singleDocuments[existingDocIndex].url;
            if (oldFileKey) {
                await deleteFilesFromS3(oldFileKey);
            }
            // Upload the new file
            const res = await uploadFilesToS3(buffer, key);
            docs.document.singleDocuments[existingDocIndex].url = res.Key;
        } else {
            // If document type does not exist, add it to the singleDocuments array
            const res = await uploadFilesToS3(buffer, key);
            singleDocUpdates.push({
                name: fieldName,
                type: fieldName,
                url: res.Key,
            });
        }
    } else {
        // Loop through each field in files and upload each file
        for (const fieldName in files) {
            const fileArray = files[fieldName];
            const isSingleType = [
                "aadhaarFront",
                "aadhaarBack",
                "eAadhaar",
                "panCard",
                "cibilReport",
                "sanctionLetter",
            ].includes(fieldName);

            if (isSingleType) {
                const file = fileArray[0]; // Get the first file for each field
                const key = `${docs.pan}/${fieldName}-${Date.now()}-${
                    file.originalname
                }`; // Construct a unique S3 key
                // Check if the document type already exists in the lead's document array
                const existingDocIndex =
                    docs.document.singleDocuments.findIndex(
                        (doc) => doc.type === fieldName
                    );

                if (existingDocIndex !== -1) {
                    // Old file URL stored in document
                    const oldFileKey =
                        docs.document.singleDocuments[existingDocIndex].url;
                    if (oldFileKey) {
                        await deleteFilesFromS3(oldFileKey);
                    }
                    const res = await uploadFilesToS3(file.buffer, key);
                    // Update the existing document's URL
                    docs.document.singleDocuments[existingDocIndex].url =
                        res.Key;

                    docs.document.singleDocuments[existingDocIndex].remarks =
                        remarks;
                } else {
                    // If document type does not exist, add it to the singleDocuments array
                    const res = await uploadFilesToS3(file.buffer, key);
                    singleDocUpdates.push({
                        name: fieldName,
                        type: fieldName,
                        url: res.Key,
                        remarks,
                    });
                }
            } else {
                // For multipleDocuments, upload each file sequentially to maintain order
                for (const [index, file] of fileArray.entries()) {
                    // Get the current count of documents for this field in the database
                    const existingDocsCount =
                        docs.document.multipleDocuments[fieldName]?.length || 0;

                    const name = `${fieldName}_${
                        existingDocsCount + index + 1
                    }`;
                    const key = `${
                        docs.pan
                    }/${fieldName}/${fieldName}-${Date.now()}-${
                        file.originalname
                    }`;
                    const fileRemark = Array.isArray(remarks)
                        ? remarks[index]
                        : remarks; // Get corresponding remark for each file

                    const res = await uploadFilesToS3(file.buffer, key);
                    multipleDocUpdates[fieldName].push({
                        name: name,
                        url: res.Key,
                        remarks: fileRemark,
                    });
                }
            }
        }
    }

    // Add single document updates to the lead document
    if (singleDocUpdates.length > 0) {
        docs.document.singleDocuments.push(...singleDocUpdates);
    }

    // Add multiple document updates to the lead document
    for (const [field, document] of Object.entries(multipleDocUpdates)) {
        if (document.length > 0) {
            docs.document.multipleDocuments[field].push(...document);
        }
    }

    // Use findByIdAndUpdate to only update the document field
    const updatedDocs = await Documents.findByIdAndUpdate(
        docs._id,
        { document: docs.document },
        { new: true, runValidators: false } // Disable validation for other fields
    );

    if (!updatedDocs) {
        return { success: false };
    }
    return { success: true };
};

export const getDocs = async (docs, docType, docId) => {
    // Find the specific document based on docType
    let document;
    const isSingleType = [
        "aadhaarFront",
        "aadhaarBack",
        "eAadhaar",
        "panCard",
        "cibilReport",
        "sanctionLetter",
    ].includes(docType);

    if (isSingleType) {
        document = docs.document.singleDocuments.find(
            (doc) => doc.type === docType
        );
    } else {
        document = docs.document.multipleDocuments[docType]?.find(
            (doc) => doc._id.toString() === docId
        );
    }

    if (!document) {
        throw new Error(`Document of type ${docType} not found`);
    }

    const mimeType = getMimeTypeForDocType(document.url, docType);

    // Generate a pre-signed URL for this specific document
    const preSignedUrl = generatePresignedUrl(document.url, mimeType);

    return { preSignedUrl, mimeType };
};

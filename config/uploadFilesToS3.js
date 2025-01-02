import S3 from "aws-sdk/clients/s3.js";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const region = process.env.AWS_REGION;
const bucketName = process.env.AWS_BUCKET_NAME;

const s3 = new S3({ region, accessKeyId, secretAccessKey });

// Upload files to S3
async function uploadFilesToS3(buffer, key) {
    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
    try {
        // Check file size before uploading
        if (buffer.length > MAX_FILE_SIZE) {
            throw new Error("File size exceeds 25 MB");
        }

        var params = {
            Bucket: bucketName,
            Body: buffer,
            Key: key,
        };
        return await s3.upload(params).promise();
    } catch (error) {
        console.log(error);
    }
}

// Delete old files from S3
async function deleteFilesFromS3(key) {
    try {
        const params = {
            Bucket: bucketName,
            Key: key,
        };
        await s3.deleteObject(params).promise();
        console.log(`File deleted successfully: ${key}`);
    } catch (error) {
        console.error(`Error deleting file: ${key}`, error);
        throw new Error("Failed to delete old file from S3");
    }
}

// Generate a pre-signed URL for each document
const generatePresignedUrl = (key, mimeType) => {
    const params = {
        Bucket: bucketName,
        Key: key,
        Expires: 3 * 60 * 60, // Set expiration time in seconds (e.g., 1 hour)
        ResponseContentDisposition: "inline", // Display the file in the browser
        ResponseContentType: mimeType || "application/octet-stream", // Ensure correct MIME type
    };
    return s3.getSignedUrl("getObject", params);
};

export { uploadFilesToS3, deleteFilesFromS3, generatePresignedUrl };

// Helper function to get MIME type based on document type
const getMimeTypeForDocType = (docUrl, docType) => {
    const extention = docUrl.split(".").pop();

    switch (docType) {
        case "aadhaarFront":
        case "aadhaarBack":
        case "panCard":
        case "salarySlip":
            return extention === "jpg" ||
                extention === "jpeg" ||
                extention === "png" ||
                extention === "svg"
                ? "image/jpg"
                : "application/pdf";
        case "bankStatement":
        case "cibilReport":
        case "sanctionLetter":
            return "application/pdf";
        case "verificationVideo":
            return "video/mp4";
        default:
            return  extention === "jpg" ||
            extention === "jpeg" ||
            extention === "png" ||
            extention === "svg"
            ? "image/jpg"
            : extention === "mp4" ? "video/mp4" : "application/pdf";
    }
};

export default getMimeTypeForDocType;

import crypto from "crypto";

const generateRandomNumber = () => {
    const randomBytes = crypto.randomBytes(4); // Generate 4 random bytes
    const randomValue = randomBytes.readUInt32BE(0); // Convert bytes to an unsigned 32-bit integer
    const randomNumber = 100000 + (randomValue % 900000); // Scale to a 6-digit number between 100000 and 999999
    return randomNumber;
};

export default generateRandomNumber;

import jwt from "jsonwebtoken";

console.log(process.env.JWT_SECRET , "JWT_SECRET");
const generateToken = (res, id) => {
    console.log("Generating Token-->" , id);
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });

    // Set JWT as HTTP-Only cookie
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: false,
        sameSite: "None",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
    });
    return token;
};

export { generateToken };

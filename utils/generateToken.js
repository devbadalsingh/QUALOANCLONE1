import jwt from "jsonwebtoken";

const generateToken = (res, id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });

    // Set JWT as HTTP-Only cookie
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: true,
        sameSite: "None",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Days
    });
};

export { generateToken };

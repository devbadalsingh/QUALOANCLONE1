import jwt from 'jsonwebtoken';
import asyncHandler from './asyncHandler.js';

const authMiddleware = asyncHandler( async (req, res, next) => {
    let token;
    if (req.cookies && req.cookies.authToken) {
        token = req.cookies.authToken;
    }
    
    else if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
     try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
        req.user = await User.findById(decoded.id)
        if (!req.user) {
            res.status(404);
            throw new Error("Employee not found");
        }
        if (!req.user.isActive) {
            res.status(401);
            throw new Error("Your account is deactivated");
        }
        req.isAuthenticated = true;
        next();
     }
     catch (err) {
        res.status(401);
        throw new Error("Not Authorized: Invalid token");
     }
    }
    else{
        res.status(403);
        throw new Error("Not Authorized!!! No token found");
    }
});

const homeMiddleware = asyncHandler(async (req, res, next) => {
    const token = req.cookies.authToken; // Retrieve the cookie

    if (!token) {
        req.isAuthenticated = false; // Mark as not authenticated
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id)
        if (!req.user) {
            res.status(404);
            throw new Error("Employee not found");
        }
        if (!req.user.isActive) {
            res.status(401);
            throw new Error("Your account is deactivated");
        }
        req.isAuthenticated = true;
        next();
    } catch (err) {
        req.isAuthenticated = false; // Invalid token
    }
    next();
}); 

export { authMiddleware , homeMiddleware}
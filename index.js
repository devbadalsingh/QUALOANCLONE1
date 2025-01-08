import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/db.js";
import "dotenv/config.js";
import morgan from "morgan";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import  userRoute  from "./routes/route.user.js";
import verifyRoute from "./routes/route.verify.js";
import loanApplicationRoute from "./routes/route.application.js";
import { homeMiddleware } from "./middleware/authMiddleware.js";    

const PORT = process.env.PORT || 3000;
connectDB();

const app = express();


// Middleware
// CORS configuration
var corsOption = {
    origin: [
        "https://www.qualoan.com",
        "https://qualoan.com",
        "http://localhost:5173",
        "https://www.crm.qualoan.com",
        "https://crm.qualoan.com",
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials : true
};

app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); //cookie parser middlerware

// Logging middleware (optional)
app.use(morgan("dev")); // Log HTTP requests

// main routes (Done)
app.get('/home', homeMiddleware , (req, res) => {
    if (req.isAuthenticated) {
        const data = {
            fullName: req.user?.personalDetails?.fullName || null,
            image: req.user?.profileImage || null,
        }
        return res.json({ message: "Welcome back, user!",isUserAuthentic: req.isAuthenticated, user: data });
    } else {
       return  res.json({ message: "Welcome to the public main page!" , isUserAuthentic: req.isAuthenticated });
    }
});

//  API routes
app.use("/api/user", userRoute);
app.use("/api/verify", verifyRoute);
app.use("/api/loanApplication", loanApplicationRoute);



// Error handling middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on   http://localhost:${PORT}`);
});

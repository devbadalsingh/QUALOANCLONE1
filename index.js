import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors"; // Import cors
import connectDB from "./config/db.js";
import "dotenv/config.js";
import morgan from "morgan";
import { notFound, errorHandler } from "./middleware/errorHandler.js";
import  userRoute  from "./routes/route.user.js";
import verifyRoute from "./routes/route.verify.js";
import applicationRoute from "./routes/route.application.js";
import { homeMiddleware } from "./middleware/authMiddleware.js";    


const PORT = process.env.PORT || 3000;
connectDB();

const app = express();


// Middleware
// CORS configuration
var corsOption = {
    origin: `http://localhost:${PORT}`,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
};

app.use(cors(corsOption));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); //cookie parser middlerware
app.use(homeMiddleware); // Auth middleware

// Logging middleware (optional)
app.use(morgan("dev")); // Log HTTP requests

// main routes
app.get('/api', homeMiddleware , (req, res) => {
    if (req.isAuthenticated) {
        res.json({ message: "Welcome back, user!", user: req.user });
    } else {
        res.json({ message: "Welcome to the public main page!" });
    }
});

//  API routes
app.use("/api/user", userRoute);
app.use("/api/verify", verifyRoute);
app.use("/api/application", applicationRoute);




// Error handling middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on   http://localhost:${PORT}`);
});

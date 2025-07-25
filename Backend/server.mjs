// server.mjs
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'; // Ensure dotenv is imported and configured
import mongoose from 'mongoose';
import session from 'express-session'; // Import express-session
import MongoStore from 'connect-mongo'; // Import connect-mongo
import passport from 'passport'; // Import passport

// Import your existing chat routes
import chatRoutes from './routes/chat.mjs';

// Import your new authentication routes
import authRoutes from './routes/auth.mjs';

// Import your Passport configuration (this file will execute the setup)
import './utils/passport.mjs';

// Load environment variables from .env file
dotenv.config();

const app = express();

// Use PORT from .env or default to 3000 (your current default is 3001)
// It's good practice to match the frontend's expected backend port.
// If your frontend is fetching from localhost:3000, keep it at 3000.
// If your frontend is fetching from localhost:8080 (as in previous code), set it to 8080.
// For consistency with the frontend code I provided, let's use 3000.
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URL; // Use your existing MONGO_URL
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_super_secret_session_key_please_change_this_in_production'; // IMPORTANT: Set this in your .env!

// --- CORS Middleware ---
// Crucial for allowing your frontend (e.g., localhost:5173) to make requests
// and send/receive cookies (for sessions)
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your actual frontend URL
  credentials: true // This is essential for sending session cookies
}));

// --- Body Parser Middleware ---
// For parsing application/json requests
app.use(express.json());

// --- Session Middleware ---
// This sets up the session management. Sessions will be stored in MongoDB.
app.use(session({
    secret: SESSION_SECRET, // A secret string used to sign the session ID cookie
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    store: MongoStore.create({
        mongoUrl: MONGODB_URI, // Your MongoDB connection string
        collectionName: 'sessions', // The collection in MongoDB where sessions will be stored
        ttl: 14 * 24 * 60 * 60, // Session will expire after 14 days (in seconds)
        autoRemove: 'interval', // Automatically remove expired sessions
        autoRemoveInterval: 10 // Interval (in minutes) to remove expired sessions
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie expires after 1 week (in milliseconds)
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        secure: process.env.NODE_ENV === 'production' // Set to true in production for HTTPS only cookies
    }
}));

// --- Passport Middleware ---
// Initialize Passport and enable persistent login sessions
app.use(passport.initialize());
app.use(passport.session());

// --- Routes ---
// Your existing chat routes
app.use("/api", chatRoutes);
// Your new authentication routes
app.use("/api/auth", authRoutes);

// --- MongoDB Connection Function ---
const connectToDatabase = async () => {
    try {
        // Use mongoose.connect directly
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB successfully.");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        // Exit process if DB connection fails, as the app won't function without it
        process.exit(1);
    }
};

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Backend ready to receive requests from frontend.");
    connectToDatabase(); // Connect to DB when server starts listening
});

// --- Optional: Basic Home route ---
app.get('/', (req, res) => {
    res.send('API is running.');
});

// --- Optional: Global Error Handling Middleware ---
// Catches errors that are not caught by specific route handlers
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).send('Something broke on the server!');
});
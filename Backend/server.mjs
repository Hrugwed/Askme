// server.mjs
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';
import cookieParser from 'cookie-parser';

import chatRoutes from './routes/chat.mjs';
import authRoutes from './routes/auth.mjs';

import './utils/passport.mjs';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URL; 
const SESSION_SECRET = process.env.SESSION_SECRET; // IMPORTANT: MUST BE SET IN .env for production


app.use(cors({
    // Configure origins for all your deployed frontends and local dev
    origin: [
        'https://askme-frontend-n6b6.onrender.com', // Your primary Vercel frontend URL
    ],
    credentials: true, // Essential for sending/receiving cookies
    allowedHeaders: ['Content-Type', 'Authorization'] 
}));

app.use(express.json()); // For parsing application/json
app.use(cookieParser());

app.use(session({
    secret: SESSION_SECRET,
    resave: false, // Don't save session if unmodified
    saveUninitialized: false, // Don't create session until something is stored
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions', // Collection name for sessions in MongoDB
        ttl: 14 * 24 * 60 * 60, // Session TTL in seconds (e.g., 14 days)
        autoRemove: 'interval', // Auto-remove expired sessions
        autoRemoveInterval: 10 // Interval in minutes for auto-removal
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7, // Cookie expiration time (7 days)
        httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
        // 'secure' should be true in production (HTTPS) and false for local HTTP development
        secure: process.env.NODE_ENV === 'production', 
        // 'sameSite' should be 'none' for cross-site (frontend on Vercel, backend on Render)
        // and 'lax' for local development
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' 
    }
}));

// Passport.js middleware
app.use(passport.initialize());
app.use(passport.session());

// Route handlers
app.use("/api", chatRoutes);
app.use("/api/auth", authRoutes);

// Connect to MongoDB
const connectToDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Backend: Connected to MongoDB successfully.");
    } catch (error) {
        console.error("Backend: Error connecting to MongoDB:", error);
        process.exit(1); // Exit process if database connection fails
    }
};


app.get('/debug-session', (req, res) => {
  res.json({
    cookies: req.cookies,
    session: req.session,
    user: req.user
  });
});



// Start the server
app.listen(PORT, () => {
    console.log(`Backend: Server is running on http://localhost:${PORT}`);
    console.log("Backend: Ready to receive requests from frontend.");
    connectToDatabase(); // Connect to DB when server starts
});

// Basic root route for health check
app.get('/', (req, res) => {
    res.send('API is running.');
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the server!');
});

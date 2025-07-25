// server.mjs
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import passport from 'passport';

import chatRoutes from './routes/chat.mjs';

import authRoutes from './routes/auth.mjs';

import './utils/passport.mjs';

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGO_URL; // Use your existing MONGO_URL
const SESSION_SECRET = process.env.SESSION_SECRET || 'your_super_secret_session_key_please_change_this_in_production'; // IMPORTANT: Set this in your .env!


app.use(cors({
    origin: 'https://askme-1-u8k2.onrender.com',
    credentials: true
}));

app.use(express.json());

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: MONGODB_URI,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'interval',
        autoRemoveInterval: 10
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // 'none' for cross-site in production
    }
}));

// --- DEBUG LOGS ADDED HERE ---
app.use((req, res, next) => {
    console.log('--- Request Received ---');
    console.log('Request URL:', req.originalUrl);
    console.log('Session ID (before Passport):', req.sessionID);
    console.log('Session (before Passport):', req.session);
    next();
});
// --- END DEBUG LOGS ---


app.use(passport.initialize());
app.use(passport.session());


app.use("/api", chatRoutes);

app.use("/api/auth", authRoutes);


const connectToDatabase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB successfully.");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log("Backend ready to receive requests from frontend.");
    connectToDatabase();
});


app.get('/', (req, res) => {
    res.send('API is running.');
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke on the server!');
});

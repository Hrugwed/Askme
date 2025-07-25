// routes/auth.mjs
import express from 'express';
import passport from 'passport';
import User from '../models/User.mjs'; // Import User model
const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ msg: 'Please enter all required fields' });
    }

    try {
        let user = await User.findOne({ username: username });
        if (user) {
            return res.status(400).json({ msg: 'Username already exists' });
        }

        user = new User({ username, password, email });
        await user.save();

        // Optionally log in the user immediately after registration
        req.login(user, (err) => {
            if (err) {
                console.error("Error logging in after registration:", err);
                return res.status(500).json({ msg: 'Registration successful, but login failed.' });
            }
            res.status(201).json({ msg: 'User registered and logged in successfully', user: { id: user.id, username: user.username, email: user.email } });
        });

    } catch (err) {
        console.error("Error during user registration:", err);
        // Handle unique email constraint error more gracefully if email is used
        if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
            return res.status(400).json({ msg: 'Email already registered.' });
        }
        res.status(500).json({ msg: 'Server error during registration.' });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user and log in
// @access  Public
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        console.log('Passport.authenticate callback triggered.');

        if (err) {
            console.error('Passport Auth Error (Callback):', err);
            return res.status(500).json({ msg: 'Authentication error.' });
        }
        if (!user) {
            console.log('Passport Auth Failed (Callback): No user found.', info);
            return res.status(401).json({ msg: info.message || 'Invalid credentials.' });
        }
        
        console.log('req.logIn called.');
        req.logIn(user, (err) => {
            if (err) {
                console.error('req.logIn Error:', err);
                return res.status(500).json({ msg: 'Could not log in user after authentication.' });
            }
            
            console.log('User successfully logged in (req.logIn success):', user.username);
            console.log('Session ID (after req.logIn):', req.sessionID);
            console.log('Session (after req.logIn):', req.session);

            // --- REMOVED EXPLICIT COOKIE SETTING ---
            // The express-session middleware automatically handles setting the Set-Cookie header
            // after req.logIn() is called. Explicitly setting it here can interfere.
            // console.log('Attempting to explicitly set cookie (debug mode)...');
            // res.cookie('connect.sid', req.sessionID, {
            //     maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
            // });
            // console.log('Explicit cookie set instruction sent.');
            // --- END REMOVED EXPLICIT COOKIE SETTING ---

            res.status(200).json({ msg: 'Logged in successfully', user: { id: user.id, username: user.username, email: user.email } });
        });
    })(req, res, next);
});

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private (though publicly accessible to log out)
router.get('/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((destroyErr) => { // Destroy the session in the store
            if (destroyErr) {
                console.error("Error destroying session:", destroyErr);
                return res.status(500).json({ msg: "Failed to destroy session" });
            }
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.json({ msg: 'Logged out successfully' });
        });
    });
});

// @route   GET /api/auth/current_user
// @desc    Get current logged in user
// @access  Private
router.get('/current_user', (req, res) => {
    if (req.isAuthenticated()) { // Passport adds this method to req
        res.json({ user: { id: req.user.id, username: req.user.username, email: req.user.email } });
    } else {
        res.status(401).json({ user: null, msg: 'Not authenticated' });
    }
});

export default router;

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
        if (err) {
            // Handle error during authentication (e.g., database error)
            console.error('Passport Auth Error:', err);
            return res.status(500).json({ msg: 'Authentication error.' });
        }
        if (!user) {
            // Authentication failed (e.g., incorrect username/password)
            console.log('Passport Auth Failed: No user found.', info);
            return res.status(401).json({ msg: info.message || 'Invalid credentials.' });
        }
        // If authentication succeeded, manually log in the user
        // This is crucial: req.logIn establishes the session and triggers Set-Cookie
        req.logIn(user, (err) => {
            if (err) {
                // Handle error during req.logIn (e.g., session issues)
                console.error('req.logIn Error:', err);
                return res.status(500).json({ msg: 'Could not log in user after authentication.' });
            }
            // User successfully logged in, send success response
            // The Set-Cookie header should now be sent by express-session
            res.status(200).json({ msg: 'Logged in successfully', user: { id: user.id, username: user.username, email: user.email } });
        });
    })(req, res, next); // This immediately invokes the middleware with req, res, next
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

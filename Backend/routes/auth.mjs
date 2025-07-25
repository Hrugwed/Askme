// routes/auth.mjs
import express from 'express';
import passport from 'passport';
import User from '../models/User.mjs'; 
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
        await user.save(); // User document should now have an _id

        // Log in the user immediately after registration
        req.login(user, (err) => {
            if (err) {
                console.error("Backend: Error logging in after registration:", err);
                // If login fails, still report registration success but note the login issue
                return res.status(500).json({ msg: 'Registration successful, but automatic login failed.' });
            }
            // If login is successful, send success response
            res.status(201).json({ msg: 'User registered and logged in successfully', user: { id: user.id, username: user.username, email: user.email } });
        });

    } catch (err) {
        console.error("Backend: Error during user registration:", err);
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
            console.error('Backend: Passport Auth Error (Callback):', err);
            return res.status(500).json({ msg: 'Authentication error.' });
        }
        if (!user) {
            console.log('Backend: Passport Auth Failed (Callback): No user found.', info);
            return res.status(401).json({ msg: info.message || 'Invalid credentials.' });
        }
        
        req.logIn(user, (err) => {
            if (err) {
                console.error('Backend: req.logIn Error:', err);
                return res.status(500).json({ msg: 'Could not log in user after authentication.' });
            }
            
            // Session and cookie are now managed by express-session after req.logIn()
            res.status(200).json({ msg: 'Logged in successfully', user: { id: user.id, username: user.username, email: user.email } });
        });
    })(req, res, next); // Ensure passport.authenticate is called
});

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private (though publicly accessible to log out)
router.get('/logout', (req, res, next) => {
    // req.logout is asynchronous and requires a callback
    req.logout((err) => {
        if (err) {
            console.error("Backend: Error during req.logout:", err);
            return next(err); // Pass error to Express error handler
        }
        // Destroy the session in the store and clear the cookie
        req.session.destroy((destroyErr) => { 
            if (destroyErr) {
                console.error("Backend: Error destroying session:", destroyErr);
                return res.status(500).json({ msg: "Failed to destroy session" });
            }
            res.clearCookie('connect.sid'); // Clear the session cookie from the browser
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

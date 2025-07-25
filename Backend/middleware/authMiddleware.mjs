// middleware/authMiddleware.mjs
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) { // Passport adds this method
        return next(); // User is authenticated, proceed
    }
    res.status(401).json({ msg: 'Please log in to view this resource' });
};

export default ensureAuthenticated;

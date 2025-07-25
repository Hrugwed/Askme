// middleware/authMiddleware.mjs
const ensureAuthenticated = (req, res, next) => {
    console.log('Backend: ensureAuthenticated middleware hit.');
    console.log('Backend: req.isAuthenticated() in middleware:', req.isAuthenticated());

    if (req.isAuthenticated()) { 
        console.log('Backend: User is authenticated in middleware, proceeding.');
        return next(); 
    }
    console.log('Backend: User is NOT authenticated in middleware, sending 401.');
    res.status(401).json({ msg: 'Please log in to view this resource' });
};

export default ensureAuthenticated;

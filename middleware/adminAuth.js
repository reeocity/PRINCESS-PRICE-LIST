const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    console.log('Admin authentication middleware activated.');
    console.log('JWT Secret being used:', process.env.JWT_SECRET);

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        console.log('No token provided.');
        return res.status(401).json({ message: 'No token, authorization denied.' });
    }
    try {
        console.log('Verifying token...');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
        if (!decoded.isAdmin) {
            console.log('User is not an admin.');
            return res.status(401).json({ message: 'Admin access required.' });
        }
        req.user = decoded;
        console.log('Admin authentication successful, proceeding.');
        next();
    } catch (err) {
        console.error('Token verification failed in adminAuth middleware:', err.message);
        res.status(401).json({ message: 'Token is not valid.' });
    }
}; 
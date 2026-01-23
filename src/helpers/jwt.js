const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    console.warn('WARNING: JWT_SECRET is not defined in environment variables. JWT operations will fail.');
}
const generateToken = (payload) => {
    if (!SECRET) throw new Error('JWT_SECRET is missing');
    return jwt.sign(payload, SECRET, { expiresIn: '7d' });
};
const verifyToken = (token) => {
    if (!SECRET) return null;
    try {
        return jwt.verify(token, SECRET);
    } catch (err) {
        return null;
    }
};

module.exports = { generateToken, verifyToken };

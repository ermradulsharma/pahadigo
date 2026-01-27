import jwt from 'jsonwebtoken';
if (!process.env.JWT_SECRET) {
    console.warn('WARNING: JWT_SECRET is not defined in environment variables. JWT operations will fail.');
}
const generateToken = (payload, expiresIn = '1d') => {
    const SECRET = process.env.JWT_SECRET;
    if (!SECRET) throw new Error('JWT_SECRET is missing');
    return jwt.sign(payload, SECRET, { expiresIn });
};
const verifyToken = (token) => {
    const SECRET = process.env.JWT_SECRET;
    if (!SECRET) return null;
    try {
        return jwt.verify(token, SECRET);
    } catch (err) {
        return null;
    }
};

export { generateToken, verifyToken };

import jwt from 'jsonwebtoken';
import { getAppConfig } from '@/lib/appConfig';

/**
 * Generates a JWT token using settings from appConfig.
 */
const generateToken = async (payload, expiresIn = '30d') => {
    const config = await getAppConfig();
    const SECRET = config.jwt_secret;
    if (!SECRET) throw new Error('JWT_SECRET is missing in appConfig');
    return jwt.sign(payload, SECRET, { expiresIn });
};

/**
 * Verifies a JWT token using settings from appConfig.
 */
const verifyToken = async (token) => {
    const config = await getAppConfig();
    const SECRET = config.jwt_secret;
    if (!SECRET) return null;
    try {
        return jwt.verify(token, SECRET);
    } catch (err) {
        return null;
    }
};

export { generateToken, verifyToken };

export default { generateToken, verifyToken };

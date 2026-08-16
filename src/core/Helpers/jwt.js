import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { getAppConfig } from '@/core/Lib/appConfig.js';
import { DEFAULTS } from '@/core/Constants/index.js';

/**
 * Generates an Access & Refresh token pair with unique JWT IDs (jti).
 */
const generateAuthTokens = async (payload, rememberMe = false) => {
  const config = await getAppConfig();
  const SECRET = config.jwt_secret;
  if (!SECRET) throw new Error('JWT_SECRET is missing in appConfig');

  // Access Token (24 hours)
  const accessJti = randomUUID();
  const accessToken = jwt.sign({ ...payload, jti: accessJti, type: 'access' }, SECRET, { expiresIn: '24h' });

  // Long-lived Refresh Token (7 days, or 30 days if rememberMe)
  const refreshJti = randomUUID();
  const refreshExpiresIn = rememberMe ? '30d' : '7d';
  const refreshToken = jwt.sign({ ...payload, jti: refreshJti, type: 'refresh' }, SECRET, { expiresIn: refreshExpiresIn });

  return { 
    accessToken, 
    refreshToken,
    accessJti,
    refreshJti
  };
};

/**
 * Legacy generateToken for backward compatibility, heavily deprecated.
 */
const generateToken = async (payload, expiresIn = '30d') => {
  const config = await getAppConfig();
  const SECRET = config.jwt_secret;
  if (!SECRET) throw new Error('JWT_SECRET is missing in appConfig');
  return jwt.sign(payload, SECRET, { expiresIn });
};

/**
 * Verifies a JWT token. Returns decoded payload or null.
 */
const verifyToken = async (token) => {
  const config = await getAppConfig();
  const SECRET = config.jwt_secret;
  if (!SECRET) return DEFAULTS.NULL;
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return DEFAULTS.NULL;
  }
};

/**
 * Decodes a token without verifying signature (used for extracting jti from expired tokens).
 */
const decodeToken = (token) => {
  return jwt.decode(token);
};

export { generateAuthTokens, generateToken, verifyToken, decodeToken };

export default { generateAuthTokens, generateToken, verifyToken, decodeToken };

const { verifyToken } = require('../helpers/jwt');

const authMiddleware = async (req) => {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, message: 'No token provided' };
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return { authorized: false, message: 'Invalid token' };
  }

  // Attach user to req (this works because req is an object, though in Next.js Request is read-only for some props, 
  // but we can pass it down or attach to a custom context if we were using one. 
  // For the dispatcher, we can return the user context.)
  return { authorized: true, user: decoded };
};

module.exports = authMiddleware;

const admin = require('firebase-admin');

/**
 * Middleware to verify Firebase ID Token and extract user role
 */
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    // For development convenience, if the token is "mock-admin", let it pass
    if (process.env.NODE_ENV !== 'production' && idToken === 'mock-admin') {
      req.user = { uid: 'mock-admin-uid', email: 'admin@steadypocket.com', role: 'admin' };
      return next();
    }
    res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Role-based access control middleware
 * @param {Array} allowedRoles 
 */
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user.role || 'support'; // Default to lowest role if not specified
    if (allowedRoles.includes(userRole) || userRole === 'admin') {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
  };
};

module.exports = { verifyToken, checkRole };

/**
 * Middleware to restrict access based on user roles.
 * Supports: 'Admin', 'Manager', 'Executive'
 */

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // In a production app, the role would come from a verified JWT token.
    // For this implementation, we check the 'x-user-role' header.
    const userRole = req.headers['x-user-role'] || 'Executive';

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Access Denied',
        message: `Your role (${userRole}) does not have permission to access this resource.`
      });
    }

    next();
  };
};

// Simplified authentication check (stub for actual JWT verification)
export const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  // For demonstration, we allow requests that have at least a role header
  // In reality, this would verify a Bearer token.
  if (!req.headers['x-user-role'] && !authHeader) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No authentication credentials provided.' });
  }
  
  next();
};

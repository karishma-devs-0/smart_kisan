const jwt = require('jsonwebtoken');

async function authMiddleware(req, res, next) {
  try {

    // =========================================================
    // GET AUTH HEADER
    // =========================================================

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Authorization header missing',
      });
    }

    // =========================================================
    // VALIDATE BEARER TOKEN FORMAT
    // =========================================================

    const parts = authHeader.split(' ');

    if (
      parts.length !== 2 ||
      parts[0] !== 'Bearer'
    ) {
      return res.status(401).json({
        error: 'Invalid authorization format',
      });
    }

    const token = parts[1];

    // =========================================================
    // VERIFY JWT TOKEN
    // =========================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // =========================================================
    // ATTACH USER TO REQUEST
    // =========================================================

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };

    next();

  } catch (error) {

    console.error(
      'Auth Middleware Error:',
      error.message
    );

    return res.status(401).json({
      error: 'Invalid or expired token',
    });
  }
}

module.exports = authMiddleware;

const axios = require('axios');
const jwt = require('jsonwebtoken');

// OAuth2 proxy internal service URL (within the cluster)
const OAUTH2_PROXY_AUTH_URL = process.env.OAUTH2_PROXY_AUTH_URL || 'http://oauth2-proxy.default.svc.cluster.local:4180/oauth2/auth';

// Middleware to authenticate via OAuth2 proxy
const authenticateToken = async (req, res, next) => {
  try {
    // Get cookies from the request to forward to OAuth2 proxy
    const cookies = req.headers.cookie;
    if (!cookies) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Call OAuth2 proxy to verify authentication
    const response = await axios.get(OAUTH2_PROXY_AUTH_URL, {
      headers: {
        'Cookie': cookies,
        'X-Forwarded-Proto': req.headers['x-forwarded-proto'] || 'https',
        'X-Forwarded-Host': req.headers['x-forwarded-host'] || req.headers.host,
        'X-Forwarded-Uri': req.originalUrl,
      },
      timeout: 5000,
      validateStatus: () => true // Don't throw on non-2xx status codes
    });
    if (response.status === 202 || response.status === 200) {
      // User is authenticated - extract user info from response headers
      const email = response.headers['x-auth-request-email'];
      const userId = response.headers['x-auth-request-user'] || email;
      const accessToken = response.headers['x-auth-request-access-token'];
      const JWT = response.headers['authorization'];

      // get data from JWT if available
      if (JWT && JWT.startsWith('Bearer ')) {
        const token = JWT.slice(7);
        try {
          const decoded = jwt.decode(token);
          fullName = decoded ? decoded['name'] || null : null;
          givenName = decoded ? decoded['given_name'] || null : null;
          familyName = decoded ? decoded['family_name'] || null : null;
          avatar = decoded ? decoded['picture'] || null : null;
        } catch (err) {
          console.error('Error decoding JWT:', err);
        }
      }

      if (email) {
        req.user = {
          email: email,
          userId: userId,
          accessToken: accessToken,
          name: fullName || '',
          firstName: givenName || '',
          lastName: familyName || '',
          avatar: avatar || null,
        };
        return next();
      }
    }

    // Authentication failed
    return res.status(401).json({ error: 'Authentication required' });

  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
};

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    // For now, check admin status from database
    const User = require('../models/User');
    const user = await User.findOne({ email: req.user.email });

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireInternalService: (req, res, next) => {
    // Check for internal service authorization header
    const internalToken = process.env.INTERNAL_SERVICE_TOKEN;
    const authHeader = req.headers['x-internal-token'];
    
    if (!internalToken || !authHeader || authHeader !== internalToken) {
      return res.status(403).json({ error: 'Internal service access only' });
    }
    next();
  }
};

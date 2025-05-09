const jwt = require('jsonwebtoken');
const { User, LearningSession } = require('../models');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// 验证 JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 验证用户是否有权限访问特定会话
const authorizeSession = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId;
    const userId = req.user.id;

    const session = await LearningSession.findOne({
      where: {
        id: sessionId,
        userId: userId
      }
    });

    if (!session) {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (error) {
    logger.error('Authorization error:', error);
    return res.status(403).json({ error: 'Access denied' });
  }
};

module.exports = {
  authenticateToken,
  authorizeSession
}; 
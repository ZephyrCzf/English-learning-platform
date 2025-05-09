const express = require('express');
const router = express.Router();
const learningService = require('../services/learningService');
const logger = require('../utils/logger');
const { authenticateToken, authorizeSession } = require('../middleware/auth');

// Create a new learning session
router.post('/sessions', authenticateToken, async (req, res) => {
  try {
    const { english_level, interests, targetWords } = req.body;
    const userId = req.user.id;
    const session = await learningService.createSession(english_level, interests, targetWords, userId);
    res.json(session);
  } catch (error) {
    logger.error('Error creating session:', error);
    res.status(500).json({ message: 'Failed to create session' });
  }
});

// Get articles for a session
router.get('/sessions/:sessionId/articles', authenticateToken, authorizeSession, async (req, res) => {
  try {
    logger.info('Getting articles for session:', req.params.sessionId);
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      logger.error('Invalid session ID format:', req.params.sessionId);
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    
    const articles = await learningService.getArticles(sessionId);
    
    logger.info('Articles retrieved:', {
      sessionId,
      articleCount: articles.length,
      articles: articles.map(article => ({
        id: article.id,
        title: article.title,
        hasImageUrl: !!article.imageUrl,
        imageUrl: article.imageUrl
      }))
    });
    
    res.json(articles);
  } catch (error) {
    logger.error('Error getting articles:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get quiz questions for a session
router.get('/sessions/:sessionId/quiz', authenticateToken, authorizeSession, async (req, res) => {
  try {
    logger.info('Getting quiz questions for session:', req.params.sessionId);
    const sessionId = parseInt(req.params.sessionId);
    
    if (isNaN(sessionId)) {
      logger.error('Invalid session ID format:', req.params.sessionId);
      return res.status(400).json({ error: 'Invalid session ID' });
    }
    
    const questions = await learningService.getQuizQuestions(sessionId);
    res.json(questions);
  } catch (error) {
    logger.error('Error getting quiz questions:', error);
    if (error.message === 'No quiz questions found') {
      return res.status(404).json({ error: 'No quiz questions found' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/sessions/:sessionId/rewrite', authenticateToken, authorizeSession, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { type } = req.body;
    
    if (!type || !['increase', 'decrease'].includes(type)) {
      return res.status(400).json({ message: 'Invalid rewrite type' });
    }

    const result = await learningService.rewriteArticle(sessionId, type);
    res.json(result);
  } catch (error) {
    logger.error('Error rewriting article:', error);
    res.status(500).json({ message: 'Failed to rewrite article' });
  }
});

module.exports = router; 
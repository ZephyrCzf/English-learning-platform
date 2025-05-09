router.get('/:sessionId/quiz', async (req, res) => {
  try {
    const questions = await learningService.getQuizQuestions(req.params.sessionId);
    res.json(questions);
  } catch (error) {
    logger.error('Error getting quiz questions:', error);
    res.status(500).json({ message: '获取测试题失败' });
  }
});

// 添加获取测试题状态的路由
router.get('/:sessionId/quiz-status', async (req, res) => {
  try {
    const status = await learningService.getQuizStatus(req.params.sessionId);
    res.json({ status });
  } catch (error) {
    logger.error('Error getting quiz status:', error);
    res.status(500).json({ message: '获取测试题状态失败' });
  }
}); 
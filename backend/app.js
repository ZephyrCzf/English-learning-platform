require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, LearningSession, SessionInterest, Article, QuizQuestion, QuizQuestionOption } = require('./models');
const learningRoutes = require('./routes/learning');
const userRoutes = require('./routes/userRoutes');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // 前端开发服务器的地址
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api', learningRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;

// 同步数据库
sequelize.sync({ force: true })
  .then(() => {
    console.log('Database synced successfully');
  })
  .catch(err => {
    console.error('Error syncing database:', err);
  });

const startServer = (port) => {
  const server = app.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${port} is already in use. Trying port ${port + 1}`);
      server.close();
      startServer(port + 1);
    } else {
      logger.error('Server error:', error);
      process.exit(1);
    }
  });
};

startServer(PORT); 
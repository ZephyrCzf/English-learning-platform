const { Sequelize } = require('sequelize');
const config = require('../config/database');

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: 'mysql',
    logging: false,
    define: config.define,
    dialectOptions: config.dialectOptions
  }
);

const User = require('./User')(sequelize);
const LearningSession = require('./LearningSession')(sequelize);
const SessionInterest = require('./SessionInterest')(sequelize);
const Article = require('./Article')(sequelize);
const QuizQuestion = require('./QuizQuestion')(sequelize);
const QuizQuestionOption = require('./QuizQuestionOption')(sequelize);
const TargetWord = require('./TargetWord')(sequelize);

// Define all associations
const models = {
  User,
  LearningSession,
  SessionInterest,
  Article,
  QuizQuestion,
  QuizQuestionOption,
  TargetWord
};

// Call associate methods
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  sequelize,
  ...models
}; 
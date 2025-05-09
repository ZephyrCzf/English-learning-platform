const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizQuestion = sequelize.define('QuizQuestion', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    sessionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'session_id'
    },
    question: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    correctAnswerIndex: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'correct_answer_index'
    },
    questionType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'question_type'
    },
    explanation: {
      type: DataTypes.STRING(1000),
      allowNull: true
    }
  }, {
    tableName: 'quiz_questions',
    timestamps: false
  });

  QuizQuestion.associate = (models) => {
    QuizQuestion.belongsTo(models.LearningSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
    QuizQuestion.hasMany(models.QuizQuestionOption, {
      foreignKey: 'questionId',
      as: 'options'
    });
  };

  return QuizQuestion;
}; 
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QuizQuestionOption = sequelize.define('QuizQuestionOption', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    questionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'question_id'
    },
    optionText: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'option_text'
    },
    optionOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'option_order'
    }
  }, {
    tableName: 'quiz_question_options',
    timestamps: false
  });

  QuizQuestionOption.associate = (models) => {
    QuizQuestionOption.belongsTo(models.QuizQuestion, {
      foreignKey: 'questionId',
      as: 'question'
    });
  };

  return QuizQuestionOption;
}; 
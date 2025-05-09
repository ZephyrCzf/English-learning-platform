const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LearningSession = sequelize.define('LearningSession', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'user_id'
    },
    englishLevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'english_level'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'created_at'
    }
  }, {
    tableName: 'learning_sessions',
    timestamps: false
  });

  // Define the interests association
  LearningSession.associate = (models) => {
    LearningSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    LearningSession.hasMany(models.SessionInterest, {
      foreignKey: 'sessionId',
      as: 'interests'
    });
    LearningSession.hasMany(models.TargetWord, {
      foreignKey: 'sessionId',
      as: 'targetWords'
    });
    LearningSession.hasMany(models.Article, {
      foreignKey: 'sessionId',
      as: 'articles'
    });
  };

  return LearningSession;
}; 
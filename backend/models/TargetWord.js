const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TargetWord = sequelize.define('TargetWord', {
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
    word: {
      type: DataTypes.STRING,
      allowNull: false
    },
    phonetic: {
      type: DataTypes.STRING,
      allowNull: true
    },
    chinese_meaning: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    usage_example: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'target_words',
    timestamps: false
  });

  TargetWord.associate = (models) => {
    TargetWord.belongsTo(models.LearningSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
  };

  return TargetWord;
}; 
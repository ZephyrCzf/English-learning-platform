const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Article = sequelize.define('Article', {
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
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    englishText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'english_text'
    },
    chineseText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'chinese_text'
    },
    imageUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'image_url'
    },
    articleOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'article_order'
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'expired_at'
    }
  }, {
    tableName: 'articles',
    timestamps: false
  });

  Article.associate = (models) => {
    Article.belongsTo(models.LearningSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
  };

  return Article;
}; 
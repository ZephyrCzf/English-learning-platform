const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SessionInterest = sequelize.define('SessionInterest', {
    sessionId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'session_id'
    },
    interest: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'session_interests',
    timestamps: false
  });

  SessionInterest.associate = (models) => {
    SessionInterest.belongsTo(models.LearningSession, {
      foreignKey: 'sessionId',
      as: 'session'
    });
  };

  return SessionInterest;
}; 
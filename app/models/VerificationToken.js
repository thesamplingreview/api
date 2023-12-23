const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class VerificationToken extends Model {
    /**
     * Static variables
     */
    static TYPES = {
      PHONE: 'phone',
      EMAIL: 'email',
    };
  }

  VerificationToken.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token_value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    expired_at: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'VerificationToken',
    timestamps: false,
    // paranoid: true,
    underscored: true,
  });

  return VerificationToken;
};

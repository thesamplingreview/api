const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PasswordReset extends Model {
    // static associate(models) {
    //   // ...
    // }
  }

  PasswordReset.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'PasswordReset',
    timestamps: false,
    underscored: true,
  });

  return PasswordReset;
};

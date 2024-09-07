const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuthToken extends Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  AuthToken.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
    },
    blacklisted: {
      type: DataTypes.BOOLEAN,
    },
    expired_at: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'AuthToken',
    timestamps: false,
    // paranoid: true,
    underscored: true,
  });

  return AuthToken;
};

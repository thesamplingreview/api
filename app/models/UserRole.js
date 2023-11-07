const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
    static associate(models) {
      this.hasMany(models.User, {
        foreignKey: 'role_id',
        targetKey: 'id',
      });
    }
  }

  UserRole.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
    },
    group: {
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    modelName: 'UserRole',
    timestamps: false,
    // paranoid: false,
    underscored: true,
  });

  return UserRole;
};

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class UserRole extends Model {
    // variable
    static GROUPS = {
      USER: 'user',
      ADMIN: 'admin',
      VENDOR: 'vendor',
    };

    static associate(models) {
      this.hasMany(models.User, {
        foreignKey: 'role_id',
        targetKey: 'id',
      });
    }

    static scopes(models) {
      this.addScope('users', {
        where: { group: UserRole.GROUPS.USER },
      });
      this.addScope('admins', {
        where: { group: UserRole.GROUPS.ADMIN },
      });
      this.addScope('vendors', {
        where: { group: UserRole.GROUPS.VENDOR },
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

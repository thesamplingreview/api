const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class RefRole extends Model {
    static associate(models) {
      this.hasMany(models.User, {
        foreignKey: 'role_id',
        targetKey: 'id',
      });
    }
  }

  RefRole.init({
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
    modelName: 'RefRole',
    timestamps: false,
    // paranoid: false,
    underscored: true,
  });

  return RefRole;
};

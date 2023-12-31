const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Asset extends Model {
    static associate(models) {
      // define association here
      this.belongsTo(models.User, {
        foreignKey: 'created_by',
        targetKey: 'id',
      });
      this.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        targetKey: 'id',
      });
    }
  }

  Asset.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    caption: {
      type: DataTypes.STRING,
    },
    mimetype: {
      type: DataTypes.STRING,
    },
    filesize: {
      type: DataTypes.BIGINT.UNSIGNED,
    },
    width: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    height: {
      type: DataTypes.INTEGER.UNSIGNED,
    },
    disk: {
      type: DataTypes.STRING,
    },
    tags: {
      type: DataTypes.STRING,
    },
    vendor_id: {
      type: DataTypes.UUID,
    },
    created_by: {
      type: DataTypes.UUID,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    sequelize,
    modelName: 'Asset',
    timestamps: false,
    // paranoid: true,
    underscored: true,
  });

  return Asset;
};

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Form extends Model {
    static associate(models) {
      this.hasMany(models.FormField, {
        foreignKey: 'form_id',
        targetKey: 'id',
      });
      this.hasMany(models.Campaign, {
        foreignKey: 'form_id',
        targetKey: 'id',
      });
      this.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        targetKey: 'id',
      });
    }
  }

  Form.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
    },
    cover_url: {
      type: DataTypes.STRING,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'Form',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Form;
};

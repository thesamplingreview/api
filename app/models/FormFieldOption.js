const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FormFieldOption extends Model {
    static associate(models) {
      this.belongsTo(models.FormField, {
        foreignKey: 'form_field_id',
        targetKey: 'id',
      });
    }
  }

  FormFieldOption.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    label: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sublabel: {
      type: DataTypes.STRING,
    },
    image_url: {
      type: DataTypes.STRING,
    },
    form_field_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    pos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'FormFieldOption',
    timestamps: false,
    underscored: true,
  });

  return FormFieldOption;
};

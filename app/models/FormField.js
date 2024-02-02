const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class FormField extends Model {
    static associate(models) {
      this.belongsTo(models.Form, {
        foreignKey: 'form_id',
        targetKey: 'id',
      });
      this.hasMany(models.FormFieldOption, {
        foreignKey: 'form_field_id',
        targetKey: 'id',
      });
    }
  }

  FormField.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    form_id: {
      type: DataTypes.INTEGER,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    placeholder: {
      type: DataTypes.STRING,
    },
    description: {
      type: DataTypes.STRING,
    },
    hint: {
      type: DataTypes.STRING,
    },
    config: {
      type: DataTypes.JSON,
    },
    mandatory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    use_logic: {
      type: DataTypes.BOOLEAN,
    },
    logic: {
      type: DataTypes.JSON,
    },
    pos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  }, {
    sequelize,
    modelName: 'FormField',
    timestamps: false,
    underscored: true,
  });

  return FormField;
};

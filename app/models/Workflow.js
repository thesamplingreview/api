const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Workflow extends Model {
    // associations
    static associate(models) {
      this.hasMany(models.WorkflowTask, {
        foreignKey: 'workflow_id',
        targetKey: 'id',
      });
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

  Workflow.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    vendor_id: {
      type: DataTypes.UUID,
    },
    created_by: {
      type: DataTypes.UUID,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'Workflow',
    timestamps: false,
    underscored: true,
  });

  return Workflow;
};

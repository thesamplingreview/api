const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class WorkflowTask extends Model {
    // associations
    static associate(models) {
      this.belongsTo(models.Workflow, {
        foreignKey: 'workflow_id',
        targetKey: 'id',
      });
      this.belongsTo(models.WorkflowTask, {
        foreignKey: 'parent_task_id',
        targetKey: 'id',
      });
    }
  }

  WorkflowTask.init({
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
    type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    config: {
      type: DataTypes.JSON,
    },
    created_at: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'WorkflowTask',
    timestamps: false,
    underscored: true,
  });

  return WorkflowTask;
};

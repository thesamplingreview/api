const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class QueueTask extends Model {
    /**
     * Static variables
     */
    static STATUSES = {
      PENDING: 'pending',
      COMPLETED: 'completed',
      FAILED: 'failed',
      SKIPPED: 'skipped',
    };

    /**
     * Associations
     */
    static associate(models) {
      this.belongsTo(models.QueueTask, {
        foreignKey: 'parent_queue_id',
        targetKey: 'id',
      });
      this.belongsTo(models.WorkflowTask, {
        foreignKey: 'task_id',
        targetKey: 'id',
      });
      this.belongsTo(models.Workflow, {
        foreignKey: 'workflow_id',
        targetKey: 'id',
      });
    }
  }

  QueueTask.init({
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    task_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    task_parent_id: {
      type: DataTypes.INTEGER,
    },
    parent_queue_id: {
      type: DataTypes.STRING,
    },
    grand_parent_queue_id: {
      type: DataTypes.STRING,
    },
    task_action: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    task_pos: {
      type: DataTypes.STRING,
    },
    task_data: {
      type: DataTypes.JSON,
    },
    task_config: {
      type: DataTypes.JSON,
    },
    workflow_id: {
      type: DataTypes.UUID,
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    result_obj: {
      type: DataTypes.JSON,
    },
    error_message: {
      type: DataTypes.STRING,
    },
    retry_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    trigger_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    execute_at: {
      type: DataTypes.DATE,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'QueueTask',
    timestamps: false,
    underscored: true,
  });

  return QueueTask;
};

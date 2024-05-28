const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CampaignWorkflow extends Model {
    /**
     * Static variables
     */
    static TRIGGERS = {
      ENROLMENT: 'enrolment',
    };

    static associate(models) {
      this.belongsTo(models.Campaign, {
        foreignKey: 'campaign_id',
        targetKey: 'id',
      });
      this.belongsTo(models.Workflow, {
        foreignKey: 'workflow_id',
        targetKey: 'id',
      });
    }
  }

  CampaignWorkflow.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      allowNull: false,
      primaryKey: true,
    },
    trigger: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    enable: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
    },
    campaign_id: {
      type: DataTypes.UUID,
    },
    workflow_id: {
      type: DataTypes.UUID,
    },
  }, {
    sequelize,
    modelName: 'CampaignWorkflow',
    timestamps: false,
    underscored: true,
  });

  return CampaignWorkflow;
};

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CampaignEnrolment extends Model {
    /**
     * Static variables
     */
    static STATUSES = {
      PENDING: 'pending',
      COMPLETE: 'complete',
      REJECT: 'reject',
    };

    static associate(models) {
      this.belongsTo(models.Campaign, {
        foreignKey: 'campaign_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.belongsTo(models.Form, {
        foreignKey: 'form_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  }

  CampaignEnrolment.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    campaign_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    form_id: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.STRING(30),
    },
    submissions: {
      type: DataTypes.JSON,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'CampaignEnrolment',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return CampaignEnrolment;
};

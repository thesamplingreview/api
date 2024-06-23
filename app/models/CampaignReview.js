const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CampaignReview extends Model {
    /**
     * Static variables
     */
    static associate(models) {
      this.belongsTo(models.Campaign, {
        foreignKey: 'campaign_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.belongsTo(models.User, {
        foreignKey: 'created_by',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.hasMany(models.CampaignReviewUpload, {
        foreignKey: 'review_id',
        targetKey: 'id',
      });
    }
  }

  CampaignReview.init({
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
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    review: {
      type: DataTypes.TEXT,
    },
    created_by: {
      type: DataTypes.UUID,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'CampaignReview',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return CampaignReview;
};

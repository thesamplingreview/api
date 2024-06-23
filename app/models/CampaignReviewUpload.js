const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CampaignReviewUpload extends Model {
    /**
     * Static variables
     */
    static TYPES = {
      IMAGE: 'image',
      VIDEO: 'video',
    };

    static associate(models) {
      this.belongsTo(models.CampaignReview, {
        foreignKey: 'review_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.belongsTo(models.Asset, {
        foreignKey: 'asset_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
    }
  }

  CampaignReviewUpload.init({
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    review_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    asset_id: {
      type: DataTypes.STRING,
    },
    type: {
      type: DataTypes.STRING,
    },
    url: {
      type: DataTypes.STRING,
    },
  }, {
    sequelize,
    modelName: 'CampaignReviewUpload',
    timestamps: false,
    underscored: true,
  });

  return CampaignReviewUpload;
};

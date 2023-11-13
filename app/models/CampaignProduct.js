const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CampaignProduct extends Model {

  }

  CampaignProduct.init({
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
    product_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'CampaignProduct',
    timestamps: false,
    underscored: true,
  });

  return CampaignProduct;
};

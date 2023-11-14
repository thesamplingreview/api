const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CampaignProduct extends Model {
    static associate(models) {
      this.belongsTo(models.Campaign, {
        foreignKey: 'campaign_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      this.belongsTo(models.Product, {
        foreignKey: 'product_id',
        targetKey: 'id',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
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
    filterable: {
      type: DataTypes.BOOLEAN,
      defaultValue: 0,
    },
    config: {
      type: DataTypes.JSON,
    },
  }, {
    sequelize,
    modelName: 'CampaignProduct',
    timestamps: false,
    underscored: true,
  });

  return CampaignProduct;
};

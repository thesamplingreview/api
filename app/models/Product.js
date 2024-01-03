const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    /**
     * Static variables
     */
    static STATUSES = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
    };

    static associate(models) {
      this.belongsToMany(models.Campaign, {
        through: models.CampaignProduct,
      });
      this.hasMany(models.CampaignProduct, {
        foreignKey: 'product_id',
        targetKey: 'id',
      });
    }
  }

  Product.init({
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
    description: {
      type: DataTypes.TEXT,
    },
    image_url: {
      type: DataTypes.TEXT,
    },
    brand: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    pos: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    created_at: {
      type: DataTypes.DATE,
    },
    updated_at: {
      type: DataTypes.DATE,
    },
    deleted_at: {
      type: DataTypes.DATE,
    },
  }, {
    sequelize,
    modelName: 'Product',
    timestamps: true,
    underscored: true,
    paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  return Product;
};

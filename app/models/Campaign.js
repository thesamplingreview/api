const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Campaign extends Model {
    /**
     * Static variables
     */
    static STATUSES = {
      DRAFT: 'draft',
      PUBLISH: 'publish',
    };

    static REVIEW_TYPES = {
      FORM: 'form',
      REDIRECT: 'redirect',
    };

    static associate(models) {
      this.belongsTo(models.Form, {
        foreignKey: 'form_id',
        targetKey: 'id',
      });
      this.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        targetKey: 'id',
      });
      this.hasMany(models.CampaignEnrolment, {
        foreignKey: 'campaign_id',
        targetKey: 'id',
      });
      this.belongsToMany(models.Product, {
        through: models.CampaignProduct,
      });
      this.belongsToMany(models.User, {
        through: models.CampaignEnrolment,
      });
    }
  }

  Campaign.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    intro_title: {
      type: DataTypes.STRING,
    },
    intro_description: {
      type: DataTypes.TEXT,
    },
    presubmit_title: {
      type: DataTypes.STRING,
    },
    presubmit_description: {
      type: DataTypes.TEXT,
    },
    postsubmit_title: {
      type: DataTypes.STRING,
    },
    postsubmit_description: {
      type: DataTypes.TEXT,
    },
    meta_title: {
      type: DataTypes.STRING,
    },
    meta_description: {
      type: DataTypes.STRING,
    },
    meta_keywords: {
      type: DataTypes.STRING,
    },
    review_type: {
      type: DataTypes.STRING,
    },
    review_instruction: {
      type: DataTypes.TEXT,
    },
    review_cta: {
      type: DataTypes.STRING,
    },
    cover_url: {
      type: DataTypes.STRING,
    },
    background_url: {
      type: DataTypes.STRING,
    },
    start_date: {
      type: DataTypes.DATE,
    },
    end_date: {
      type: DataTypes.DATE,
    },
    vendor_id: {
      type: DataTypes.UUID,
    },
    form_id: {
      type: DataTypes.INTEGER,
    },
    highlight: {
      type: DataTypes.BOOLEAN,
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
    modelName: 'Campaign',
    timestamps: true,
    underscored: true,
    // paranoid: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  return Campaign;
};

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Static variables
     */
    static DEFAULT_ROLE_ID = 1;

    static STATUSES = {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
    };

    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      this.belongsTo(models.UserRole, {
        foreignKey: 'role_id',
        targetKey: 'id',
      });
      this.belongsTo(models.Vendor, {
        foreignKey: 'vendor_id',
        targetKey: 'id',
      });
      this.hasMany(models.AuthToken, {
        foreignKey: 'user_id',
        targetKey: 'id',
      });
      this.hasMany(models.CampaignEnrolment, {
        foreignKey: 'user_id',
        targetKey: 'id',
      });
      this.belongsToMany(models.Campaign, {
        through: models.CampaignEnrolment,
      });
    }

    /**
     * Define model scopes here
     */
    static scopes(models) {
      this.addScope('users', {
        include: [
          {
            model: models.UserRole,
            where: { group: models.UserRole.GROUPS.USER },
          },
        ],
      });

      this.addScope('admins', {
        include: [
          {
            model: models.UserRole,
            where: {
              group: [
                models.UserRole.GROUPS.ADMIN,
                models.UserRole.GROUPS.VENDOR,
              ],
            },
          },
        ],
      });

      this.addScope('vendors', {
        include: [
          {
            model: models.UserRole,
            where: {
              group: models.UserRole.GROUPS.VENDOR,
            },
          },
        ],
      });
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING,
    },
    contact: {
      type: DataTypes.STRING,
    },
    password: {
      type: DataTypes.STRING,
    },
    google_id: {
      type: DataTypes.STRING,
    },
    facebook_id: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING(30),
    },
    role_id: {
      type: DataTypes.INTEGER,
    },
    vendor_id: {
      type: DataTypes.UUID,
    },
    last_login: {
      type: DataTypes.DATE,
    },
    email_verified_at: {
      type: DataTypes.DATE,
    },
    contact_verified_at: {
      type: DataTypes.DATE,
    },
    delivery_address: {
      type: DataTypes.JSON,
      allowNull: true,
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
    modelName: 'User',
    timestamps: true,
    // paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
  });

  return User;
};

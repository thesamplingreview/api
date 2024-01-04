const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemConfig extends Model {
    /**
     * Static variables
     */
    // internal keys
    // static INTERNAL_KEYS = [
    //   'admin_emails',
    //   'sendgrid_template_id_reset_password',
    //   'sendgrid_template_id_campaign_enrolled_user',
    //   'sendgrid_template_id_campaign_enrolled_admin',
    //   'sendgrid_template_id_signup_user',
    //   'sendgrid_template_id_signup_admin',
    // ];
  }

  SystemConfig.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    value: {
      type: DataTypes.TEXT,
    },
  }, {
    sequelize,
    modelName: 'SystemConfig',
    timestamps: false,
    // paranoid: true,
    underscored: true,
  });

  return SystemConfig;
};

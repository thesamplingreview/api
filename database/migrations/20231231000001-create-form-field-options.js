'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('form_field_options', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      label: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      sublabel: {
        type: Sequelize.TEXT,
      },
      image_url: {
        type: Sequelize.TEXT,
      },
      form_field_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'form_fields',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      pos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('form_field_options');
  },
};

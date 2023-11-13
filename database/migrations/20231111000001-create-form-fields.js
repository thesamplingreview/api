'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('form_fields', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      form_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'forms',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      placeholder: {
        type: Sequelize.STRING,
      },
      description: {
        type: Sequelize.STRING,
      },
      options: {
        type: Sequelize.STRING,
      },
      config: {
        type: Sequelize.JSON,
      },
      mandatory: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      pos: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('form_fields');
  },
};

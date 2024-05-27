'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        // table - campaign_workflows
        queryInterface.createTable('campaign_workflows', {
          id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true,
          },
          trigger: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          count: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
          },
          campaign_id: {
            type: Sequelize.UUID,
            references: {
              model: 'campaigns',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
          workflow_id: {
            type: Sequelize.UUID,
            references: {
              model: 'workflows',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE',
          },
        }, { transaction }),
        // remove campaign enrolment_workflow_id
        queryInterface.removeColumn('campaigns', 'enrolment_workflow_id'),
      ]);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.dropTable('campaign_workflows', { transaction }),
        queryInterface.addColumn('campaigns', 'enrolment_workflow_id', {
          type: Sequelize.UUID,
          after: 'form_id',
          references: {
            model: 'workflows',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        }, { transaction }),
      ]);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};

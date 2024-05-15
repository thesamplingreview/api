'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable('queue_tasks', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          allowNull: false,
          primaryKey: true,
        },
        parent_queue_id: {
          type: Sequelize.INTEGER,
        },
        // grand_parent_queue_id: {
        //   type: Sequelize.STRING,
        // },
        task_id: {
          type: Sequelize.STRING,
          allowNull: false,
          references: {
            model: 'workflow_tasks',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
        },
        task_parent_id: {
          type: Sequelize.STRING,
        },
        task_action: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        task_pos: {
          type: Sequelize.STRING,
        },
        task_data: {
          type: Sequelize.JSON,
        },
        task_config: {
          type: Sequelize.JSON,
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
        status: {
          type: Sequelize.STRING(30),
          allowNull: false,
        },
        result_obj: {
          type: Sequelize.JSON,
        },
        error_message: {
          type: Sequelize.STRING,
        },
        retry_count: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        },
        trigger_at: {
          type: Sequelize.DATE,
          allowNull: false,
        },
        execute_at: {
          type: Sequelize.DATE,
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.fn('NOW'),
        },
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('queue_tasks');
  },
};

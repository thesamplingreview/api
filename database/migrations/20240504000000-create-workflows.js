'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        // table - workflows
        queryInterface.createTable('workflows', {
          id: {
            type: Sequelize.UUID,
            allowNull: false,
            defaultValue: Sequelize.UUIDV4,
            primaryKey: true,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          vendor_id: {
            type: Sequelize.UUID,
            references: {
              model: 'vendors',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          created_by: {
            type: Sequelize.UUID,
            references: {
              model: 'users',
              key: 'id',
            },
            onUpdate: 'CASCADE',
            onDelete: 'SET NULL',
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
          updated_at: {
            type: Sequelize.DATE,
            allowNull: false,
          },
        }, { transaction }),
        // table - workflow_tasks
        queryInterface.createTable('workflow_tasks', {
          id: {
            type: Sequelize.STRING,
            allowNull: false,
            primaryKey: true,
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
          action: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          pos: {
            type: Sequelize.STRING,
          },
          config: {
            type: Sequelize.JSON,
          },
          created_at: {
            type: Sequelize.DATE,
            allowNull: false,
            defaultValue: Sequelize.fn('NOW'),
          },
        }, { transaction }),
        // FK - campaigns -> enrolment_workflow_id
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

      // FK - workflow_tasks -> parent_task_id
      await queryInterface.addColumn('workflow_tasks', 'parent_task_id', {
        type: Sequelize.STRING,
        after: 'workflow_id',
        references: {
          model: 'workflow_tasks',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      }, { transaction });

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
        queryInterface.dropTable('workflow_tasks', { transaction }),
        queryInterface.dropTable('workflows', { transaction }),
        queryInterface.removeColumn('campaigns', 'workflow_id'),
      ]);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
};

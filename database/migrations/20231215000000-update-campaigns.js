'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn('campaigns', 'excerpt', {
          type: Sequelize.STRING,
          after: 'description',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'intro_description', {
          type: Sequelize.TEXT,
          after: 'intro_title',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'presubmit_title', {
          type: Sequelize.STRING,
          after: 'intro_description',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'presubmit_description', {
          type: Sequelize.TEXT,
          after: 'presubmit_title',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'postsubmit_title', {
          type: Sequelize.STRING,
          after: 'presubmit_description',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'postsubmit_description', {
          type: Sequelize.TEXT,
          after: 'postsubmit_title',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'background_url', {
          type: Sequelize.STRING,
          after: 'cover_url',
        }, { transaction }),
      ]);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('campaigns', 'intro_title'),
      queryInterface.removeColumn('campaigns', 'intro_description'),
      queryInterface.removeColumn('campaigns', 'presubmit_title'),
      queryInterface.removeColumn('campaigns', 'presubmit_description'),
      queryInterface.removeColumn('campaigns', 'postsubmit_title'),
      queryInterface.removeColumn('campaigns', 'postsubmit_description'),
      queryInterface.removeColumn('campaigns', 'background_url'),
    ]);
  },
};

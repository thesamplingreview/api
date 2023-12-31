'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn('campaigns', 'review_type', {
          type: Sequelize.STRING,
          after: 'meta_keywords',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'review_instruction', {
          type: Sequelize.TEXT,
          after: 'review_type',
        }, { transaction }),
        queryInterface.addColumn('campaigns', 'review_cta', {
          type: Sequelize.TEXT,
          after: 'review_instruction',
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
      queryInterface.removeColumn('campaigns', 'review_type'),
      queryInterface.removeColumn('campaigns', 'review_instruction'),
      queryInterface.removeColumn('campaigns', 'review_cta'),
    ]);
  },
};

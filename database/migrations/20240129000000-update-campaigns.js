'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn('campaigns', 'theme', {
          type: Sequelize.STRING,
          after: 'highlight',
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
      queryInterface.removeColumn('campaigns', 'theme'),
    ]);
  },
};

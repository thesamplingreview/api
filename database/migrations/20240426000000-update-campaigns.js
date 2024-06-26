'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn('campaigns', 'quota', {
          type: Sequelize.INTEGER,
          after: 'end_date',
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
      queryInterface.removeColumn('campaigns', 'quota'),
    ]);
  },
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn('users', 'google_id', {
          type: Sequelize.STRING,
          after: 'password',
        }, { transaction }),
        queryInterface.addColumn('users', 'facebook_id', {
          type: Sequelize.STRING,
          after: 'google_id',
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
      queryInterface.removeColumn('users', 'google_id'),
      queryInterface.removeColumn('users', 'facebook_id'),
    ]);
  },
};

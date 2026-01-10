'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.addColumn('users', 'delivery_address', {
        type: Sequelize.JSON,
        allowNull: true,
        after: 'contact_verified_at',
      }, { transaction });

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    return queryInterface.removeColumn('users', 'delivery_address');
  },
};

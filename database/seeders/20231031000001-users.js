'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    const users = [
      {
        name: 'SA',
        email: 'sa@admin.com',
        password: bcrypt.hashSync('123qwe', 12),
        status: 'active',
        role_id: 9,
      },
    ];

    // Disable foreign key checks
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: Sequelize.QueryTypes.RAW });

    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkInsert('users', users, {});

    // Enable foreign key check
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: Sequelize.QueryTypes.RAW });
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    // Disable foreign key checks
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: Sequelize.QueryTypes.RAW });

    await queryInterface.bulkDelete('users', null, {});

    // Enable foreign key check
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: Sequelize.QueryTypes.RAW });
  },
};

'use strict';

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
    const roles = [
      {
        id: 1,
        name: 'User',
        code: 'usr',
        group: 'user',
      },
      {
        id: 2,
        name: 'Admin',
        code: 'adm',
        group: 'admin',
      },
      {
        id: 3,
        name: 'Staff',
        code: 'stf',
        group: 'admin',
      },
      {
        id: 9,
        name: 'SA',
        code: 'sa',
        group: 'admin',
      },
    ];

    // Disable foreign key checks
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: Sequelize.QueryTypes.RAW });

    await queryInterface.bulkDelete('user_roles', null, {});
    await queryInterface.bulkInsert('user_roles', roles, {});

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

    await queryInterface.bulkDelete('user_roles', null, {});

    // Enable foreign key check
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: Sequelize.QueryTypes.RAW });
  },
};

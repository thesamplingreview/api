'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await Promise.all([
        queryInterface.addColumn('form_fields', 'use_logic', {
          type: Sequelize.BOOLEAN,
          after: 'mandatory',
        }, { transaction }),
        queryInterface.addColumn('form_fields', 'logic', {
          type: Sequelize.JSON,
          after: 'use_logic',
        }, { transaction }),
        queryInterface.removeColumn('form_fields', 'options'),
      ]);

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  },
  async down(queryInterface, Sequelize) {
    return Promise.all([
      queryInterface.removeColumn('form_fields', 'use_logic'),
      queryInterface.removeColumn('form_fields', 'logic'),
      queryInterface.addColumn('form_fields', 'options', {
        type: Sequelize.STRING,
        after: 'hint',
      }),
    ]);
  },
};

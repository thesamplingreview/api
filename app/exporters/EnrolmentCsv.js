const BaseCsv = require('./BaseCsv');
const { Campaign, User } = require('../models');
const EnrolmentService = require('../services/EnrolmentService');

class EnrolmentCsv extends BaseCsv {
  constructor({ filter, formFields }) {
    super();

    this.filter = filter;
    this.appendColumns = formFields.map((field) => {
      return {
        key: `submissions.${field.id}`,
        header: field.name,
      };
    });
  }

  columns() {
    return [
      {
        key: 'Campaign.name',
        header: 'Campaign',
      },
      {
        key: 'User.name',
        header: 'User',
      },
      {
        key: 'User.email',
        header: 'Email',
      },
      {
        key: 'User.contact',
        header: 'Contact Number',
      },
      {
        key: 'created_at',
        header: 'Date',
      },
      ...this.appendColumns,
    ];
  }

  async data() {
    const enrolmentService = new EnrolmentService();
    const query = {
      where: this.filter,
      order: [['id', 'ASC']],
      include: [
        {
          model: Campaign,
          attributes: ['name', 'slug'],
        },
        {
          model: User,
          attributes: ['name', 'email', 'contact'],
        },
      ],
      raw: true,
    };
    const results = await enrolmentService.findAll(query);
    return results;
  }
}

module.exports = EnrolmentCsv;

const BaseCsv = require('./BaseCsv');
const { Campaign, User } = require('../models');
const EnrolmentService = require('../services/EnrolmentService');

class EnrolmentCsv extends BaseCsv {
  constructor({ filter, formFields }) {
    super();

    this.filter = filter;
    // append columns
    const appendColumns = [];
    formFields.forEach((field) => {
      // ignore type
      if (field.type === 'static') {
        return;
      }
      // special extraction for address type
      if (field.type === 'address') {
        appendColumns.push({
          key: `submissions.${field.id}.name`,
          header: `${field.name} (Name)`,
        });
        appendColumns.push({
          key: `submissions.${field.id}.email`,
          header: `${field.name} (Email)`,
        });
        appendColumns.push({
          key: `submissions.${field.id}.state`,
          header: `${field.name} (State)`,
        });
        appendColumns.push({
          key: `submissions.${field.id}.postal`,
          header: `${field.name} (Postal)`,
        });
        appendColumns.push({
          key: `submissions.${field.id}.address`,
          header: `${field.name} (Address)`,
        });
        appendColumns.push({
          key: `submissions.${field.id}.contact`,
          header: `${field.name} (Contact)`,
        });
      } else {
        appendColumns.push({
          key: `submissions.${field.id}`,
          header: field.name,
        });
      }
    });
    this.appendColumns = appendColumns;
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
    // products mappings
    // @todo - not straight forwards as each enrolment might have different form
    return results;
  }
}

module.exports = EnrolmentCsv;

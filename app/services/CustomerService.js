// const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { getInput } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { User } = require('../models');

class CustomerService extends BaseService {
  constructor() {
    super(User.scope('users'));
  }

  async genWhereQuery(req) {
    const whereQuery = {};

    return whereQuery;
  }

  async create(input, options) {
    const formData = {
      email: input.email,
      contact: input.contact || null,
      name: input.name || null,
      password: input.password ? bcrypt.hashSync(input.password, 12) : null,
      status: input.status || User.STATUSES.ACTIVE,
      vendor_id: input.vendor_id || null,
      role_id: User.DEFAULT_ROLE_ID,
    };
    const result = await this.model.create(formData, options);

    return result;
  }

  async update(record, input, options) {
    const formData = {
      contact: getInput(input.contact, record.contact),
      name: getInput(input.name, record.name),
      status: getInput(input.status, record.status),
      role_id: getInput(input.role_id, record.role_id),
    };
    if (input.password) {
      formData.password = bcrypt.hashSync(input.password, 12);
    }
    const result = await record.update(formData, options);

    return result;
  }
}

module.exports = CustomerService;

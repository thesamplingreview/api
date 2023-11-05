const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { getInput } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { User } = require('../models');

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  async genWhereQuery(req) {
    const whereQuery = {};
    // ignore sa
    whereQuery.email = {
      [Op.ne]: 'sa@admin.com',
    };

    return whereQuery;
  }

  async create(input) {
    const formData = {
      email: input.email,
      contact: input.contact || null,
      name: input.name || null,
      password: input.password ? bcrypt.hashSync(input.password, 12) : null,
      status: input.status || 'active',
      role_id: input.role_id || 1,
    };
    const result = await this.model.create(formData);

    return result;
  }

  async update(record, input) {
    const formData = {
      contact: getInput(input.contact, record.contact),
      name: getInput(input.name, record.name),
      status: getInput(input.status, record.status),
      role_id: getInput(input.role_id, record.role_id),
    };
    if (input.password) {
      formData.password = bcrypt.hashSync(input.password, 12);
    }
    const result = await record.update(formData);

    return result;
  }
}

module.exports = UserService;

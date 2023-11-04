const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
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
      [Op.ne]: 'saa@admin.com',
    };

    return whereQuery;
  }

  async create(input) {
    const formdata = {
      email: input.email,
      contact: input.contact || null,
      name: input.name || null,
      password: bcrypt.hashSync(input.password, 12),
      status: input.status || 'active',
      role_id: input.role_id || 1,
    };
    const result = await this.model.create(formdata);

    return result;
  }
}

module.exports = UserService;

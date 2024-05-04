const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { getInput } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { User } = require('../models');

class AdminService extends BaseService {
  constructor(roleGroup) {
    super(User.scope(roleGroup));
  }

  genWhereQuery(req) {
    const whereQuery = {};

    // filter - role_id
    if (req.query.role_id?.trim()) {
      whereQuery.role_id = req.query.role_id;
    }
    // filter - vendor_id
    if (req.query.vendor_id?.trim()) {
      whereQuery.vendor_id = req.query.vendor_id;
    }

    // ignore sa
    whereQuery.email = {
      [Op.ne]: 'sa@admin.com',
    };

    return whereQuery;
  }

  genOrdering(req) {
    // currently only support single column ordering
    const sort = super.getSortMeta(req);
    return sort ? [sort] : [['id', 'ASC']];
  }

  async create(input, options = {}) {
    const formData = {
      email: input.email,
      name: input.name || null,
      contact: input.contact || null,
      password: input.password ? bcrypt.hashSync(input.password, 12) : null,
      status: input.status || User.STATUSES.ACTIVE,
      role_id: input.role_id || null,
      vendor_id: input.vendor_id || null,
    };
    const result = await this.model.create(formData, options);

    return result;
  }

  async update(record, input, options = {}) {
    const formData = {
      name: getInput(input.name, record.name),
      contact: getInput(input.contact, record.contact),
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

module.exports = AdminService;

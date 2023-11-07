const { getInput } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { Vendor } = require('../models');

class UserService extends BaseService {
  constructor() {
    super(Vendor);
  }

  async genWhereQuery(req) {
    const whereQuery = {};

    return whereQuery;
  }

  async create(input) {
    const formData = {
      name: input.email,
      logo: input.logo || null,
      profile: input.profile || null,
    };
    const result = await this.model.create(formData);

    return result;
  }

  async update(record, input) {
    const formData = {
      name: getInput(input.name, record.name),
      logo: getInput(input.logo, record.logo),
      profile: getInput(input.profile, record.profile),
    };
    const result = await record.update(formData);

    return result;
  }
}

module.exports = UserService;

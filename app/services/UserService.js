const bcrypt = require('bcryptjs');
const { getInput } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { User } = require('../models');

class UserService extends BaseService {
  constructor() {
    super(User);
  }

  async update(record, input, options) {
    const formData = {
      contact: getInput(input.contact, record.contact),
      name: getInput(input.name, record.name),
    };
    if (input.password) {
      formData.password = bcrypt.hashSync(input.password, 12);
    }
    if (input.delivery_address !== undefined) {
      formData.delivery_address = input.delivery_address;
    }
    const result = await record.update(formData, options);

    return result;
  }
}

module.exports = UserService;

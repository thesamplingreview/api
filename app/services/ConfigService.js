const BaseService = require('./BaseService');
const { SystemConfig } = require('../models');

class ConfigService extends BaseService {
  constructor() {
    super(SystemConfig);
  }

  genWhereQuery(req) {
    const whereQuery = {};

    // filter - keys
    if (req.query.keys?.trim()) {
      const keys = req.query.keys.split(',');
      whereQuery.key = keys;
    }

    return whereQuery;
  }

  async save(input, options = {}) {
    let config = await this.model.findOne({
      where: { key: input.key },
    });
    if (!config) {
      config = new SystemConfig({
        key: input.key,
      });
    }
    config.value = input.value;

    const result = await config.save(options);
    return result;
  }
}

module.exports = ConfigService;

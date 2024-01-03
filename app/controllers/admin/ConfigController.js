const ApiController = require('../ApiController');
const { ValidationFailed } = require('../../errors');
const { sequelize, SystemConfig } = require('../../models');
const ConfigService = require('../../services/ConfigService');

class ConfigController extends ApiController {
  constructor() {
    super();

    this.configService = new ConfigService();
  }

  /**
   * GET - all
   */
  async get(req, res) {
    try {
      // must define keys
      if (!req.query.keys?.trim()) {
        throw new ValidationFailed('query.keys is required.');
      }

      const query = {
        where: this.configService.genWhereQuery(req),
      };
      const results = await this.configService.findAll(query);

      // transform
      const configKeys = req.query.keys.trim().split(',');
      const dataset = this.processResponse(configKeys, results);

      return this.responseJson(req, res, {
        data: dataset,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - save
   */
  async save(req, res) {
    const configs = req.body.configs || [];

    if (!configs.length) {
      return this.responseJson(req, res, {
        data: [],
      });
    }

    // DB update
    const t = await sequelize.transaction();
    try {
      const promises = configs.map((config) => {
        return this.configService.save(config, { transaction: t });
      });

      const results = await Promise.all(promises);

      await t.commit();

      // transform
      const configKeys = configs.map((d) => d.key);
      const dataset = this.processResponse(configKeys, results);

      return this.responseJson(req, res, {
        data: dataset,
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * INTERNAL
   */
  processResponse(keys, dataset) {
    const configs = dataset.reduce((acc, data) => ({
      ...acc,
      [data.key]: data.value,
    }), {});

    return keys.reduce((acc, key) => ({
      ...acc,
      [key]: configs[key] || null,
    }), {});
  }
}

module.exports = ConfigController;

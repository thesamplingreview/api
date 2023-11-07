const { ModelNotFound } = require('../errors');

class BaseService {
  constructor(model) {
    this.model = model;
  }

  async genWhereQuery() {
    return {};
  }

  async findAll(options = {}) {
    const results = await this.model.findAll(options);

    return results;
  }

  async paginate(options = {}, page = 1, perPage = 10) {
    const { count, rows } = await this.model.findAndCountAll({
      ...options,
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    // fix group_by issue
    // @ref: https://github.com/sequelize/sequelize/issues/6148
    const total = typeof count === 'number' ? count : count.length;

    return {
      data: rows,
      meta: {
        count: rows.length,
        total,
        page,
        perPage,
      },
    };
  }

  async findOne(options = {}) {
    const result = await this.model.findOne(options);
    if (!result) {
      throw new ModelNotFound('Data not found');
    }

    return result;
  }

  async findbyId(id, options = {}) {
    const result = await this.findOne({
      ...options,
      where: { id },
    });

    return result;
  }

  async create(data) {
    const result = await this.model.create(data);

    return result;
  }

  async update(record, data) {
    const result = await record.update(data);

    return result;
  }

  async delete(record) {
    const result = await record.destroy();

    return result;
  }

  async updateById(id, data) {
    const record = await this.findbyId(id);
    const result = await this.update(record, data);

    return result;
  }

  async deleteById(id) {
    const record = await this.findbyId(id);
    const result = await this.delete(record);

    return result;
  }

  async getTableName() {
    return this.model.options.tableName;
  }
}

module.exports = BaseService;

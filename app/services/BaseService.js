const { ModelNotFound } = require('../errors');

class BaseService {
  constructor(model) {
    this.model = model;
  }

  getSortMeta(req) {
    const { sort } = req.query;
    if (!sort) {
      return null;
    }
    let sortKey = sort;
    let sortOrder = 'ASC';
    if (sort.startsWith('-')) {
      sortKey = sort.substring(1);
      sortOrder = 'DESC';
    }
    return [sortKey, sortOrder];
  }

  async genWhereQuery() {
    return {};
  }

  async genOrdering(req) {
    // currently only support single column ordering
    const sort = this.getSortMeta(req);
    return sort ? [sort] : [];
  }

  async findAll(options = {}) {
    const results = await this.model.findAll(options);

    return results;
  }

  async paginate(options = {}, page = 1, perPage = 10) {
    const [rows, total] = await Promise.all([
      this.model.findAll({
        ...options,
        limit: perPage,
        offset: (page - 1) * perPage,
      }),
      // count() break if having include options, hence simply using where on count query
      this.model.count({
        where: options.where || null,
      }),
    ]);

    return {
      data: rows,
      meta: {
        count: rows.length,
        total,
        page,
        perPage,
      },
    };

    // const { count, rows } = await this.model.findAndCountAll({
    //   ...options,
    //   limit: perPage,
    //   offset: (page - 1) * perPage,
    // });

    // // fix group_by issue
    // // @ref: https://github.com/sequelize/sequelize/issues/6148
    // const total = typeof count === 'number' ? count : count.length;

    // return {
    //   data: rows,
    //   meta: {
    //     count: rows.length,
    //     total,
    //     page,
    //     perPage,
    //   },
    // };
  }

  async findOne(options = {}) {
    const result = await this.model.findOne(options);
    if (!result) {
      throw new ModelNotFound('Data not found');
    }

    return result;
  }

  async findById(id, options = {}) {
    const result = await this.model.findByPk(id, options);
    if (!result) {
      throw new ModelNotFound('Data not found');
    }

    return result;
  }

  async count(options = {}) {
    const result = await this.model.count(options);

    return result;
  }

  async create(data, options = {}) {
    const result = await this.model.create(data, options);

    return result;
  }

  async update(record, data, options = {}) {
    const result = await record.update(data, options);

    return result;
  }

  async delete(record, options = {}) {
    const result = await record.destroy(options);

    return result;
  }

  async updateById(id, data) {
    const record = await this.findById(id);
    const result = await this.update(record, data);

    return result;
  }

  async deleteById(id) {
    const record = await this.findById(id);
    const result = await this.delete(record);

    return result;
  }

  async getTableName() {
    return this.model.options.tableName;
  }
}

module.exports = BaseService;

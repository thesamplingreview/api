const { Product } = require('../models');

class ProductResource {
  constructor(data) {
    this.data = data instanceof Product ? data.get({ plain: true }) : data;
  }

  toJSON() {
    return this.data;
  }

  static collection(dataset) {
    return dataset.map((data) => new ProductResource(data).toJSON());
  }
}

module.exports = ProductResource;

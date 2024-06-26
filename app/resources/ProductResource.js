const { Product } = require('../models');

class ProductResource {
  constructor(data) {
    this.data = data instanceof Product ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.CampaignProduct !== undefined) {
      relations.campaign_products = {
        id: this.data.CampaignProduct?.id || '',
        filterable: this.data.CampaignProduct?.filterable || false,
        config: this.data.CampaignProduct?.config || null,
      };
    }

    return {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description,
      image_url: this.data.image_url,
      brand: this.data.brand,
      status: this.data.status,
      vendor_id: this.data.vendor_id,
      pos: this.data.pos,
      created_at: this.data.created_at,
      updated_at: this.data.updated_at,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new ProductResource(data).toJSON());
  }
}

module.exports = ProductResource;

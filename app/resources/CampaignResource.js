const { Campaign } = require('../models');
const VendorResource = require('./VendorResource');
const FormResource = require('./FormResource');
const UserResource = require('./UserResource');
const ProductResource = require('./ProductResource');

class CampaignResource {
  constructor(data) {
    this.data = data instanceof Campaign ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.Vendor !== undefined) {
      relations.vendor = this.data.Vendor ? new VendorResource(this.data.Vendor) : null;
    }
    if (this.data.Form !== undefined) {
      relations.form = this.data.Form ? new FormResource(this.data.Form) : null;
    }
    if (this.data.Products !== undefined) {
      relations.products = this.data.Products.map((d) => new ProductResource(d));
    }
    if (this.data.Users !== undefined) {
      relations.users = this.data.Users.map((d) => new UserResource(d));
    }

    return {
      id: this.data.id,
      name: this.data.name,
      slug: this.data.slug,
      description: this.data.description,
      meta_title: this.data.meta_title,
      meta_description: this.data.meta_description,
      meta_keywords: this.data.meta_keywords,
      cover_url: this.data.cover_url,
      start_date: this.data.start_date,
      end_date: this.data.end_date,
      status: this.data.status,
      pos: this.data.pos,
      vendor_id: this.data.vendor_id,
      form_id: this.data.form_id,
      created_at: this.data.created_at,
      updated_at: this.data.updated_at,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new CampaignResource(data).toJSON());
  }
}

module.exports = CampaignResource;

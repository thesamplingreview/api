const { Vendor } = require('../models');

class VendorResource {
  constructor(data) {
    this.data = data instanceof Vendor ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const counts = {};
    if (this.data.adminsCount !== undefined) {
      counts.admins_count = this.data.adminsCount;
    }

    const relations = {};
    if (this.data.Users !== undefined) {
      const UserResource = require('./UserResource');
      relations.users = this.data.Users.map((d) => new UserResource(d));
    }

    return {
      id: this.data.id,
      name: this.data.name,
      profile: this.data.profile || null,
      logo_url: this.data.logo_url || null,
      created_at: this.data.created_at || null,
      updated_at: this.data.updated_at || null,
      ...counts,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new VendorResource(data).toJSON());
  }
}

module.exports = VendorResource;

const { Vendor } = require('../models');

class VendorResource {
  constructor(data) {
    this.data = data instanceof Vendor ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const counts = {};
    if (this.data.usersCount !== undefined) {
      counts.users_count = this.data.usersCount;
    }

    return {
      id: this.data.id,
      name: this.data.name,
      profile: this.data.profile || null,
      logo: this.data.logo || null,
      created_at: this.data.created_at || null,
      updated_at: this.data.updated_at || null,
      ...counts,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new VendorResource(data).toJSON());
  }
}

module.exports = VendorResource;

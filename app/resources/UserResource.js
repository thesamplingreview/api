const VendorResource = require('./VendorResource');

class UserResource {
  constructor(data) {
    this.data = data;
  }

  toJSON() {
    const relations = {};
    if (this.data.UserRole !== undefined) {
      relations.user_role = this.data.UserRole ? {
        id: this.data.UserRole.id,
        name: this.data.UserRole.name,
        code: this.data.UserRole.code,
      } : null;
    }
    if (this.data.Vendor !== undefined) {
      relations.vendors = this.data.Vendor ? new VendorResource(this.data.Vendor) : null;
    }

    return {
      id: this.data.id,
      email: this.data.email,
      contact: this.data.contact || null,
      name: this.data.name || null,
      status: this.data.status,
      role_id: this.data.role_id,
      vendor_id: this.data.vendor_id,
      last_login: this.data.last_login || null,
      email_verified_at: this.data.email_verified_at || null,
      created_at: this.data.created_at || null,
      updated_at: this.data.updated_at || null,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new UserResource(data).toJSON());
  }
}

module.exports = UserResource;

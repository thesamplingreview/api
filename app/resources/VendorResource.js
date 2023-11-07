class VendorResource {
  constructor(data) {
    this.data = data;
  }

  toJSON() {
    return {
      id: this.data.id,
      name: this.data.name,
      profile: this.data.profile || null,
      logo: this.data.logo || null,
      created_at: this.data.created_at || null,
      updated_at: this.data.updated_at || null,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new VendorResource(data).toJSON());
  }
}

module.exports = VendorResource;

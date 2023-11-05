class UserResource {
  constructor(data) {
    this.data = data;
  }

  toJSON() {
    const relations = {};
    if (this.data.RefRole !== undefined) {
      relations.ref_role = this.data.RefRole ? {
        id: this.data.RefRole.id,
        name: this.data.RefRole.name,
        code: this.data.RefRole.code,
      } : null;
    }

    return {
      id: this.data.id,
      email: this.data.email,
      contact: this.data.contact,
      name: this.data.name,
      status: this.data.status,
      role_id: this.data.role_id,
      last_login: this.data.last_login,
      email_verified_at: this.data.email_verified_at,
      created_at: this.data.created_at,
      updated_at: this.data.updated_at,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new UserResource(data).toJSON());
  }
}

module.exports = UserResource;

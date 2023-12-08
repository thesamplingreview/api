const { Form, FormField } = require('../models');

class FormResource {
  constructor(data) {
    this.data = data instanceof Form ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.FormFields !== undefined) {
      relations.fields = this.data.FormFields.map((d) => {
        return d instanceof FormField ? d.get({ plain: true }) : d;
      }).sort((a, b) => a.pos - b.pos);
    }
    if (this.data.Campaigns !== undefined) {
      relations.campaigns = this.data.Campaigns.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
      }));
    }

    const counts = {};
    if (this.data.fieldsCount !== undefined) {
      counts.fields_count = this.data.fieldsCount;
    }

    return {
      id: this.data.id,
      name: this.data.name,
      description: this.data.description || null,
      cover_url: this.data.cover_url || null,
      created_at: this.data.created_at || null,
      updated_at: this.data.updated_at || null,
      ...counts,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new FormResource(data).toJSON());
  }
}

module.exports = FormResource;

const { Form, FormField } = require('../models');

class FormResource {
  constructor(data) {
    this.data = data instanceof Form ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.FormFields !== undefined) {
      relations.fields = this.data.FormFields.map((d) => {
        const field = d instanceof FormField ? d.get({ plain: true }) : d;
        
        // Fix invalid config strings (e.g., '[object Object]')
        if (field.config && typeof field.config === 'string') {
          try {
            // Try to parse if it looks like JSON
            if (field.config.trim().startsWith('{') || field.config.trim().startsWith('[')) {
              field.config = JSON.parse(field.config);
            } else {
              // If it's '[object Object]' or similar invalid string, set to null
              field.config = null;
            }
          } catch (e) {
            // If parsing fails, set to null
            field.config = null;
          }
        }
        
        if (field.FormFieldOptions !== undefined) {
          field.options = field.FormFieldOptions.sort((a, b) => a.pos - b.pos);
          delete field.FormFieldOptions;
        }
        return field;
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
      vendor_id: this.data.vendor_id || null,
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

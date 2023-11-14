const { Op } = require('sequelize');
const { getInput } = require('../helpers/utils');
const { s3Upload, s3Remove } = require('../helpers/upload');
const BaseService = require('./BaseService');
const { Form, FormField } = require('../models');

class FormService extends BaseService {
  constructor() {
    super(Form);
  }

  async genWhereQuery(req) {
    const whereQuery = {};
    // filter - name
    if (req.query.name?.trim()) {
      whereQuery.name = {
        [Op.like]: `%${req.query.name}%`,
      };
    }

    return whereQuery;
  }

  async create(input, options = {}) {
    // create - form model
    const formData = {
      name: input.name,
      description: input.description || null,
    };
    if (input.cover?.filepath) {
      const s3Url = await s3Upload(input.cover, 'forms');
      if (s3Url) {
        formData.cover_url = s3Url;
      }
    }
    const result = await this.model.create(formData, options);

    // create - form fields
    if (input.fields && input.fields.length) {
      const fields = await this.syncFormFields(result, input.fields, [], options);
      result.setDataValue('FormFields', fields);
    }

    return result;
  }

  async update(record, input, options = {}) {
    // update - form model
    const formData = {
      name: getInput(input.name, record.name),
      description: getInput(input.description, record.profile),
    };
    if (input.cover !== undefined && input.cover?.filepath) {
      const s3Url = await s3Upload(input.cover, 'forms', {
        replace: record.cover_url,
      });
      if (s3Url) {
        formData.cover_url = s3Url;
      }
    } else if (input.cover !== undefined) {
      if (record.cover_url) {
        await s3Remove(record.cover_url);
      }
      formData.cover_url = null;
    }
    const result = await record.update(formData, options);

    // update - form field model
    if (input.fields && input.fields.length) {
      const oldIds = await record.getFormFields().then((ds) => ds.map((d) => d.id));
      const fields = await this.syncFormFields(result, input.fields, oldIds, options);
      result.setDataValue('FormFields', fields);
    }

    return result;
  }

  /**
   * Sync form <> formField dataset
   * - this method will auto-cleanup old records if the record was not included inside `fields`
   *
   * @param  {model}  form
   * @param  {array}  fields
   * @param  {string[]}  oldIds - used for verification
   * @param  {object}  options - sequelize options
   * @return {model[]}
   */
  async syncFormFields(form, fields, oldIds = [], options = {}) {
    // using oldIds to check for fields under same form only, in order to prevent the case if passing another form's field_id
    const dataset = fields.map((field, index) => ({
      id: field.id && oldIds.includes(field.id) ? field.id : null,
      name: field.name || null,
      type: field.type || null,
      description: field.description || null,
      placeholder: field.placeholder || null,
      options: field.options || null,
      config: field.config || null,
      mandatory: field.mandatory || false,
      status: field.status || false,
      form_id: form.id,
      pos: index,
    }));

    const results = await FormField.bulkCreate(dataset, {
      updateOnDuplicate: ['name', 'type', 'description', 'placeholder', 'options', 'config', 'mandatory', 'status', 'pos'],
      // returning: true, // not for mysql
      individualHooks: true,
      ...options,
    });

    // clean up orpaned records
    const newIds = results.map((d) => d.id);
    await FormField.destroy({
      where: {
        id: { [Op.notIn]: newIds },
        form_id: form.id,
      },
    }, options);

    return results;
  }
}

module.exports = FormService;

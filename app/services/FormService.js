const { Op } = require('sequelize');
const { getInput } = require('../helpers/utils');
// const { s3Upload, s3Remove } = require('../helpers/upload');
const BaseService = require('./BaseService');
const { Form, FormField, FormFieldOption } = require('../models');

class FormService extends BaseService {
  constructor() {
    super(Form);
  }

  genWhereQuery(req) {
    const whereQuery = {};
    // filter - name
    if (req.query.name?.trim()) {
      whereQuery.name = {
        [Op.like]: `%${req.query.name}%`,
      };
    }

    return whereQuery;
  }

  genOrdering(req) {
    // currently only support single column ordering
    const sort = super.getSortMeta(req);
    return sort ? [sort] : [['created_at', 'ASC']];
  }

  async create(input, options = {}) {
    // create - form model
    const formData = {
      name: input.name,
      description: input.description || null,
    };
    // deprecated
    // if (input.cover?.filepath) {
    //   const s3Url = await s3Upload(input.cover, 'forms');
    //   if (s3Url) {
    //     formData.cover_url = s3Url;
    //   }
    // }
    const result = await this.model.create(formData, options);

    return result;
  }

  async update(record, input, options = {}) {
    // update - form model
    const formData = {
      name: getInput(input.name, record.name),
      description: getInput(input.description, record.profile),
    };
    // deprecated
    // if (input.cover !== undefined && input.cover?.filepath) {
    //   const s3Url = await s3Upload(input.cover, 'forms', {
    //     replace: record.cover_url,
    //   });
    //   if (s3Url) {
    //     formData.cover_url = s3Url;
    //   }
    // } else if (input.cover !== undefined) {
    //   if (record.cover_url) {
    //     await s3Remove(record.cover_url);
    //   }
    //   formData.cover_url = null;
    // }
    const result = await record.update(formData, options);

    // update - form field model
    if (input.fields?.length) {
      const oldFields = await record.getFormFields();
      const fields = await this.syncFormFields(result, input.fields, oldFields, options);
      result.setDataValue('FormFields', fields);
    }

    return result;
  }

  /**
   * Sync form <> formField dataset
   * - this method will auto-cleanup old records if the record was not included inside `fields`
   *
   * @param  {model}  form
   * @param  {array}  newFields
   * @param  {string[]}  oldFields
   * @param  {object}  options - sequelize options
   * @return {model[]}
   */
  async syncFormFields(form, newFields, oldFields, options) {
    // using oldFields to double check for fields under same form only, in order to prevent the case if passing another form's field_id
    const promises = newFields.map(async (field, index) => {
      let currField;
      if (field.id) {
        currField = oldFields.find((d) => d.id === field.id);
      }
      if (!currField) {
        currField = new FormField();
      }
      currField.name = field.name || null;
      currField.type = field.type || null;
      currField.description = field.description || null;
      currField.hint = field.hint || null;
      currField.placeholder = field.placeholder || null;
      currField.config = field.config || null;
      currField.mandatory = field.mandatory || false;
      // currField.options = field.options || null;
      currField.status = field.status || false;
      currField.form_id = form.id;
      currField.pos = index;

      const result = await currField.save(options);
      // sync formFieldOptions
      if (result.type === 'select') {
        const newOptions = await this.syncFormFieldOptions(result, field.options || [], options);
        result.setDataValue('FormFieldOptions', newOptions);
      }

      return result;
    });
    const results = await Promise.all(promises);

    // clean up orpaned records
    const newIds = results.map((d) => d.id);
    await FormField.destroy({
      where: {
        id: { [Op.notIn]: newIds },
        form_id: form.id,
      },
      ...options,
    });

    return results;
  }

  /**
   * Sync formField <> formFieldOptions dataset
   * - this method will auto-cleanup old records if the record was not included inside `options`
   *
   * @param  {model}  formField
   * @param  {array}  newOptions
   * @param  {object}  options - sequelize options
   * @return {model[]}
   */
  async syncFormFieldOptions(field, newOptions, options = {}) {
    const oldOptions = await field.getFormFieldOptions();
    const dataset = newOptions.map((option, index) => {
      let isIdValid = false;
      if (option.id) {
        const oldOption = oldOptions.find((d) => d.id === option.id);
        isIdValid = Boolean(oldOption);
      }

      return {
        id: isIdValid ? option.id : null,
        form_field_id: field.id,
        key: option.key,
        label: option.label,
        sublabel: option.sublabel || null,
        image_url: option.image_url || null,
        pos: index,
      };
    });

    const results = await FormFieldOption.bulkCreate(dataset, {
      updateOnDuplicate: [
        'key', 'label', 'sublabel', 'image_url', 'pos',
      ],
      individualHooks: true,
      ...options,
    });

    // clean up orpaned records
    const newIds = results.map((d) => d.id);
    await FormFieldOption.destroy({
      where: {
        id: { [Op.notIn]: newIds },
        form_field_id: field.id,
      },
      ...options,
    });

    return results;
  }
}

module.exports = FormService;

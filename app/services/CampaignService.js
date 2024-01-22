const { Op } = require('sequelize');
const allOptions = require('../../config/options');
const { getInput, toDate } = require('../helpers/utils');
const { s3Upload, s3Remove } = require('../helpers/upload');
const { ModelNotFound } = require('../errors');
const BaseService = require('./BaseService');
const {
  Campaign, CampaignProduct, CampaignEnrolment, Form, FormField, FormFieldOption, Product,
} = require('../models');

class CampaignService extends BaseService {
  constructor() {
    super(Campaign);
  }

  genWhereQuery(req) {
    const whereQuery = {};

    // filter - name
    if (req.query.name?.trim()) {
      whereQuery.name = {
        [Op.like]: `%${req.query.name}%`,
      };
    }
    // filter - status
    if (req.query.status?.trim()) {
      whereQuery.status = req.query.status.trim();
    }
    // filter - date
    if (req.query.state?.trim()) {
      const stateVal = req.query.state.trim();
      const now = new Date();
      if (stateVal === 'past') {
        whereQuery.start_date = {
          [Op.lt]: now,
        };
        whereQuery.end_date = {
          [Op.lt]: now,
        };
      } else if (stateVal === 'coming') {
        whereQuery.start_date = {
          [Op.gt]: now,
        };
        whereQuery.end_date = {
          [Op.gt]: now,
        };
      } else if (stateVal === 'current') {
        whereQuery.start_date = {
          [Op.lte]: now,
        };
        whereQuery.end_date = {
          [Op.gte]: now,
        };
      }
    }

    return whereQuery;
  }

  genOrdering(req) {
    // currently only support single column ordering
    const sort = super.getSortMeta(req);
    return sort ? [sort] : [['pos', 'ASC']];
  }

  async findBySlug(slug, options = {}) {
    const result = await this.model.findOne({
      ...options,
      where: { slug },
    });
    if (!result) {
      throw new ModelNotFound('Data not found');
    }

    return result;
  }

  async create(input, options = {}) {
    const formData = {
      slug: input.slug,
      name: input.name,
      description: input.description || null,
      intro_title: input.intro_title || null,
      intro_description: input.intro_description || null,
      presubmit_title: input.presubmit_title || null,
      presubmit_description: input.presubmit_description || null,
      postsubmit_title: input.postsubmit_title || null,
      postsubmit_description: input.postsubmit_description || null,
      meta_title: input.meta_title || null,
      meta_description: input.meta_description || null,
      meta_keywords: input.meta_keywords || null,
      review_type: input.review_type || null,
      review_instruction: input.review_instruction || null,
      review_cta: input.review_cta || null,
      start_date: toDate(input.start_date, null),
      end_date: toDate(input.end_date, null),
      vendor_id: input.vendor_id || null,
      form_id: input.form_id || null,
      status: input.status || Campaign.STATUSES.DRAFT,
      pos: input.pos || 0,
    };
    if (input.cover?.filepath) {
      const s3Url = await s3Upload(input.cover, 'campaigns');
      if (s3Url) {
        formData.cover_url = s3Url;
      }
    }
    if (input.background?.filepath) {
      const s3Url = await s3Upload(input.background, 'campaigns');
      if (s3Url) {
        formData.background_url = s3Url;
      }
    }

    const result = await this.model.create(formData, options);

    return result;
  }

  async update(record, input, options = {}) {
    const formData = {
      slug: getInput(input.slug, record.slug),
      name: getInput(input.name, record.name),
      description: getInput(input.description, record.description),
      intro_title: getInput(input.intro_title, record.intro_title),
      intro_description: getInput(input.intro_description, record.intro_description),
      presubmit_title: getInput(input.presubmit_title, record.presubmit_title),
      presubmit_description: getInput(input.presubmit_description, record.presubmit_description),
      postsubmit_title: getInput(input.postsubmit_title, record.postsubmit_title),
      postsubmit_description: getInput(input.postsubmit_description, record.postsubmit_description),
      meta_title: getInput(input.meta_title, record.meta_title),
      meta_description: getInput(input.meta_description, record.meta_description),
      meta_keywords: getInput(input.meta_keywords, record.meta_keywords),
      review_type: getInput(input.review_type, record.review_type),
      review_instruction: getInput(input.review_instruction, record.review_instruction),
      review_cta: getInput(input.review_cta, record.review_cta),
      start_date: input.start_date !== undefined ? toDate(input.start_date, null) : record.start_date,
      end_date: input.end_date !== undefined ? toDate(input.end_date, null) : record.end_date,
      vendor_id: getInput(input.vendor_id, record.vendor_id),
      form_id: getInput(input.form_id, record.form_id),
      status: getInput(input.status, record.status),
      pos: getInput(input.pos, record.pos),
    };
    // cover
    if (input.cover !== undefined && input.cover?.filepath) {
      const s3Url = await s3Upload(input.cover, 'campaigns', {
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
    // background
    if (input.background !== undefined && input.background?.filepath) {
      const s3Url = await s3Upload(input.background, 'campaigns', {
        replace: record.background_url,
      });
      if (s3Url) {
        formData.background_url = s3Url;
      }
    } else if (input.background !== undefined) {
      if (record.background_url) {
        await s3Remove(record.background_url);
      }
      formData.background_url = null;
    }
    const result = await record.update(formData, options);

    return result;
  }

  /**
   * Sync campaign <> products dataset
   * - this method using create / update approach (multi-query)
   * - this method will auto-cleanup old records if the record was not included inside `products`
   *
   * @param  {model}  record
   * @param  {array}  products
   * @param  {object}  options - sequelize transaction
   * @return {model[]}
   */
  async syncProducts(record, products, options = {}) {
    if (!products.length) {
      return [];
    }

    // create / update
    const promises = products.filter((product) => product.id)
      .map(async (product) => {
        const key = {
          campaign_id: record.id,
          product_id: product.id,
        };
        let linked = await CampaignProduct.findOne({
          where: key,
        }, options);
        if (!linked) {
          linked = CampaignProduct.build(key);
        }
        linked.filterable = product.filterable || false;
        linked.config = product.config || null;
        const result = await linked.save(options);

        return result;
      });

    const updated = await Promise.all(promises);

    // remove orphan record
    const updatedIds = updated.map((d) => d.id);
    await CampaignProduct.destroy({
      where: {
        id: { [Op.notIn]: updatedIds },
        campaign_id: record.id,
      },
    });

    return updated;
  }

  /**
   * Calculate overall stats of campaign
   *
   * @param  {string}  campaignId
   * @return {object}
   */
  async reportStats(campaignId) {
    const count = await CampaignEnrolment.count({
      where: {
        campaign_id: campaignId,
      },
    });

    return {
      enrolments: count,
    };
  }

  /**
   * Calculate answer counts of campaign
   *
   * @param  {string}  campaignId
   * @return {object}
   */
  async reportCounts(campaignId) {
    const campaign = await this.findOne({
      where: {
        id: campaignId,
      },
      include: [
        { model: CampaignEnrolment },
        { model: Product },
        {
          model: Form,
          include: [{
            model: FormField,
            include: [FormFieldOption],
          }],
        },
      ],
    });

    const enrolments = campaign.CampaignEnrolments || [];
    const genValuesCount = (key) => {
      return enrolments.reduce((acc, item) => {
        let values = item.submissions[key];
        if (!Array.isArray(values)) {
          values = [values];
        }

        values.forEach((value) => {
          acc[value] = (acc[value] || 0) + 1;
        });
        return acc;
      }, {});
    };

    // @tbc - allowed counts for certains types only
    const questions = campaign.Form?.FormFields.map((field) => {
      let options = [];
      let optionsCounts = null;
      if (field.type === 'select') {
        options = field.FormFieldOptions || [];
        const valuesCount = genValuesCount(field.id);
        optionsCounts = options.map((opt) => ({
          id: opt.id,
          name: opt.label,
          count: valuesCount[opt.label] || 0,
        }));
      } else if (field.type === 'yes_no') {
        options = ['Yes', 'No'];
        const valuesCount = genValuesCount(field.id);
        optionsCounts = options.map((v) => ({
          id: v,
          name: v,
          count: valuesCount[v] || 0,
        }));
      } else if (field.type === 'state') {
        options = allOptions.states;
        const valuesCount = genValuesCount(field.id);
        optionsCounts = options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          count: valuesCount[opt.id] || 0,
        }));
      } else if (field.type === 'products') {
        options = campaign.Products?.reduce((acc, cur) => ({
          ...acc,
          [cur.id]: cur.name,
        }), {});
        const valuesCount = genValuesCount(field.id);
        optionsCounts = Object.keys(options).map((id) => ({
          id,
          name: options[id],
          count: valuesCount[id] || 0,
        }));
      }

      // remove non-supported fields
      if (!optionsCounts) {
        return null;
      }
      const { FormFieldOptions, ...attrs } = field.get({ plain: true });
      return {
        ...attrs,
        options,
        optionsCounts,
      };
    })
      .filter((d) => d) // remove non-count questions
      .sort((a, b) => a.pos - b.pos); // manual sort

    return questions;
  }
}

module.exports = CampaignService;

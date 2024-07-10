const { Op } = require('sequelize');
const { getInput, toDate } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { CampaignEnrolment } = require('../models');

class EnrolmentService extends BaseService {
  constructor() {
    super(CampaignEnrolment);
  }

  genWhereQuery(req) {
    const whereQuery = {};

    // filter - campaign_id
    if (req.query.campaign_id) {
      whereQuery.campaign_id = req.query.campaign_id;
    }
    // filter - user_id
    if (req.query.user_id) {
      whereQuery.user_id = req.query.user_id;
    }
    // filter - user_name
    if (req.query.user_name) {
      whereQuery['$User.name$'] = {
        [Op.like]: `%${req.query.user_name}%`,
      };
    }
    // filter - user_email
    if (req.query.user_email) {
      whereQuery['$User.email$'] = {
        [Op.like]: `%${req.query.user_email}%`,
      };
    }
    // filter - form_id
    if (req.query.form_id) {
      whereQuery.form_id = req.query.form_id;
    }
    // filter - status
    if (req.query.status) {
      whereQuery.status = req.query.status;
    }
    // filter - date
    if (req.query.date_from || req.query.date_to) {
      const fromDt = toDate(req.query.date_from);
      const toDt = toDate(req.query.date_to);
      if (fromDt && toDt) {
        whereQuery.created_at = {
          [Op.between]: [fromDt, toDt],
        };
      } else if (fromDt) {
        whereQuery.created_at = {
          [Op.gte]: fromDt,
        };
      } else if (toDt) {
        whereQuery.created_at = {
          [Op.lte]: toDt,
        };
      }
    }
    // filter - vendor_id (need campaign relations)
    if (req.query.vendor_id) {
      whereQuery['$Campaign.vendor_id$'] = req.query.vendor_id;
    }

    return whereQuery;
  }

  genOrdering(req) {
    // currently only support single column ordering
    const sort = super.getSortMeta(req);
    return sort ? [sort] : [['created_at', 'ASC']];
  }

  async create(input, options = {}) {
    const formData = {
      campaign_id: input.campaign_id,
      user_id: input.user_id,
      form_id: input.form_id || null,
      submissions: input.submissions,
    };

    const result = await this.model.create(formData, options);

    return result;
  }

  async update(record, input, options = {}) {
    const formData = {
      status: getInput(input.status, record.status),
    };
    const result = await record.update(formData, options);

    return result;
  }
}

module.exports = EnrolmentService;

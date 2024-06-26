const { Op } = require('sequelize');
const { toDate } = require('../helpers/utils');
const BaseService = require('./BaseService');
const { CampaignReview, CampaignReviewUpload } = require('../models');

class ReviewService extends BaseService {
  constructor() {
    super(CampaignReview);
  }

  genWhereQuery(req) {
    const whereQuery = {};

    // filter - campaign_id
    if (req.query.campaign_id) {
      whereQuery.campaign_id = req.query.campaign_id;
    }
    // filter - user_id
    if (req.query.created_by) {
      whereQuery.created_by = req.query.created_by;
    }
    // filter - rating
    if (req.query.rating) {
      whereQuery.rating = req.query.rating;
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
      whereQuery['$Campaign.vendor_id$'] = req.user.vendor_id;
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
      created_by: input.created_by,
      rating: input.rating,
      review: input.review,
    };

    const result = await this.model.create(formData, options);
    if (Array.isArray(input.uploads)) {
      await this.syncUploads(result, input.uploads, options);
    }

    return result;
  }

  async update(record, input, options = {}) {
    const formData = {
      rating: input.rating,
      review: input.review,
    };

    const result = await record.update(formData, options);
    if (Array.isArray(input.uploads)) {
      await this.syncUploads(result, input.uploads, options);
    }

    return result;
  }

  /**
   * Sync review <> uploads dataset
   * - this method will auto-cleanup old records if the record was not included inside `uploads`
   *
   * @param  {model}  record
   * @param  {array}  uploads
   * @param  {object}  options - sequelize options
   * @return {model[]}
   */
  async syncUploads(record, uploads, options) {
    const oldUploads = await record.getCampaignReviewUploads();

    const promises = uploads.map(async (data) => {
      let upload = oldUploads.find((d) => d.asset_id === data.asset_id && d.review_id === record.id);
      if (!upload) {
        upload = new CampaignReviewUpload();
        upload.review_id = record.id;
      }
      upload.asset_id = data.asset_id;
      upload.url = data.url;
      upload.type = 'asset';

      upload = await upload.save(options);
      return upload;
    });
    const results = await Promise.all(promises);

    // clean up orpaned records
    const newIds = results.map((d) => d.id);
    await CampaignReviewUpload.destroy({
      ...options,
      where: {
        id: { [Op.notIn]: newIds },
        review_id: record.id,
      },
    });

    return results;
  }
}

module.exports = ReviewService;

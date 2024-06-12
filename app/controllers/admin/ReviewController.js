const ApiController = require('../ApiController');
const {
  sequelize, Campaign, User, Product,
} = require('../../models');
const ReviewService = require('../../services/ReviewService');
const CampaignReviewResource = require('../../resources/CampaignReviewResource');
const ReviewCsv = require('../../exporters/ReviewCsv');

class ReviewController extends ApiController {
  constructor() {
    super();

    this.reviewService = new ReviewService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: this.reviewService.genWhereQuery(req),
        order: this.reviewService.genOrdering(req),
        include: [
          { model: Campaign },
          { model: User },
        ],
      };
      const { page, perPage } = this.getPaginate(req);
      const results = await this.reviewService.paginate(query, page, perPage);

      return this.responsePaginate(req, res, {
        data: CampaignReviewResource.collection(results.data),
        meta: results.meta,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - single
   */
  async getSingle(req, res) {
    try {
      const record = await this.reviewService.findById(req.params.id, {
        include: [
          { model: Campaign, include: [Product] },
          { model: User },
        ],
      });

      return this.responseJson(req, res, {
        data: new CampaignReviewResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - update
   */
  // async update(req, res) {
  //   // validated
  //   const formData = {
  //     status: req.body.status,
  //   };

  //   // DB update
  //   const t = await sequelize.transaction();
  //   try {
  //     const record = await this.reviewService.findById(req.params.id);
  //     const updated = await this.reviewService.update(record, formData, { transaction: t });

  //     await t.commit();
  //     return this.responseJson(req, res, {
  //       data: new CampaignReviewResource(updated),
  //     });
  //   } catch (err) {
  //     await t.rollback();
  //     return this.responseError(req, res, err);
  //   }
  // }

  /**
   * DELETE - remove
   */
  async remove(req, res) {
    // DB update
    const t = await sequelize.transaction();
    try {
      const record = await this.reviewService.findById(req.params.id);
      const deleted = await this.reviewService.delete(record, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new CampaignReviewResource(deleted),
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  /**
   * GET - options
   */
  async options(req, res) {
    const campaigns = await Campaign.findAll({
      attributes: ['id', 'name'],
    });
    const options = {
      campaigns,
    };

    return this.responseJson(req, res, {
      data: options,
    });
  }

  /**
   * GET - export
   */
  async export(req, res) {
    try {
      const reviewCsv = new ReviewCsv({
        filter: this.reviewService.genWhereQuery(req),
      });
      const csv = await reviewCsv.toCsv();

      return this.responseCsv(req, res, csv);
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = ReviewController;

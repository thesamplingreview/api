const {
  Op, literal, fn, col,
} = require('sequelize');
const { toDate } = require('../../helpers/utils');
const ApiController = require('../ApiController');
const {
  User, UserRole, CampaignEnrolment,
} = require('../../models');

class ReportController extends ApiController {
  /**
   * GET - signup
   */
  async countSignup(req, res) {
    const whereQuery = {};
    if (req.query.date_from || req.query.date_to) {
      whereQuery.created_at = this.genDateFilterConditions(
        req.query.date_from,
        req.query.date_to,
      );
    }

    const result = await User.findAll({
      where: whereQuery,
      include: [
        {
          model: UserRole,
          attributes: [],
          where: { group: UserRole.GROUPS.USER },
        },
      ],
      attributes: [
        [fn('DATE', literal('created_at')), 'day'],
        [fn('COUNT', col('User.id')), 'count'],
      ],
      group: ['day'],
      subQuery: false,
      raw: true,
    });

    return this.responseJson(req, res, {
      data: result,
    });
  }

  /**
   * GET - enrolments
   */
  async countEnrolments(req, res) {
    const whereQuery = {};
    if (req.query.campaign_id) {
      whereQuery.campaign_id = req.query.campaign_id;
    }
    if (req.query.date_from || req.query.date_to) {
      whereQuery.created_at = this.genDateFilterConditions(
        req.query.date_from,
        req.query.date_to,
      );
    }

    const result = await CampaignEnrolment.findAll({
      where: whereQuery,
      attributes: [
        [fn('DATE', literal('created_at')), 'day'],
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['day'],
      raw: true,
    });

    return this.responseJson(req, res, {
      data: result,
    });
  }

  genDateFilterConditions(from, to) {
    const fromDt = toDate(from);
    const toDt = toDate(to);
    if (fromDt && toDt) {
      return {
        [Op.between]: [fromDt, toDt],
      };
    }
    if (fromDt) {
      return {
        [Op.gte]: fromDt,
      };
    }
    if (toDt) {
      return {
        [Op.lte]: toDt,
      };
    }
    return {};
  }
}

module.exports = ReportController;

const ApiController = require('./ApiController');
const { RefRole } = require('../../models');
const UserService = require('../../services/UserService');

class UserController extends ApiController {
  constructor() {
    super();

    this.userService = new UserService();
  }

  /**
   * GET - all
   */
  async getAll(req, res) {
    try {
      const query = {
        where: await this.userService.genWhereQuery(req),
        include: [RefRole],
      };
      const results = await this.userService.paginate(query, 1, 10);

      return this.responsePaginate(req, res, results);
    } catch (err) {
      return this.responseError(req, res, err.message);
    }
  }

  /**
   * POST - create
   */
  async create(req, res) {
    try {
      const formdata = req.body;
      const result = await this.userService.create(formdata);

      return this.responseJson(req, res, {
        data: result,
      });
    } catch (err) {
      return this.responseError(req, res, err.message);
    }
  }
}

module.exports = UserController;

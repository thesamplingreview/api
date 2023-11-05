const ApiController = require('../ApiController');
const { RefRole } = require('../../models');
const UserService = require('../../services/UserService');
const UserResource = require('../../resources/UserResource');

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

      return this.responsePaginate(req, res, {
        data: UserResource.collection(results.data),
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
      const record = await this.userService.findbyId(req.params.id);
      record.RefRole = await record.getRefRole();

      return this.responseJson(req, res, {
        data: new UserResource(record),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - create
   */
  async create(req, res) {
    // validated
    const formData = {
      email: req.body.email,
      password: req.body.password,
      contact: req.body.contact,
      name: req.body.name,
      // static
      status: 'active',
      role_id: 1,
    };
    try {
      const result = await this.userService.create(formData);

      return this.responseJson(req, res, {
        data: new UserResource(result),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * PUT - update
   */
  async update(req, res) {
    // validated
    const formData = {
      password: req.body.password,
      contact: req.body.contact,
      name: req.body.name,
      status: req.body.status,
      role_id: req.body.role_id,
    };

    try {
      const record = await this.userService.findbyId(req.params.id);
      const updated = await this.userService.update(record, formData);

      return this.responseJson(req, res, {
        data: new UserResource(updated),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * DELETE - remove
   */
  async remove(req, res) {
    try {
      const record = await this.userService.findbyId(req.params.id);
      const deleted = await this.userService.delete(record);

      return this.responseJson(req, res, {
        data: new UserResource(deleted),
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = UserController;

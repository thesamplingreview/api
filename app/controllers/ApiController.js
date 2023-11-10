const { debug } = require('../../config/app');
const {
  ModelNotFound,
  AuthError,
  ValidationFailed,
  InvalidToken,
} = require('../errors');

class ApiController {
  /**
   * Debug info
   */
  getDebugInfo(req, res, data = {}) {
    if (!debug) {
      return null;
    }

    return {
      debug: {
        ...data,
        body: req.body,
        query: req.query,
      },
    };
  }

  /**
   * Success response
   */
  responseJson(req, res, data = {}) {
    return res.json({
      code: 200,
      ...data,
      ...this.getDebugInfo(req, res),
    });
  }

  /**
   * Success pagination
   */
  responsePaginate(req, res, data = {}) {
    return res.json({
      code: 200,
      data: data.data,
      meta: data.meta,
      ...this.getDebugInfo(req, res),
    });
  }

  /**
   * Error response
   */
  responseError(req, res, err, data = {}, code = 500) {
    if (err instanceof ModelNotFound) {
      return res.status(404)
        .json({
          code: 404,
          error: 'Model not found',
          ...this.getDebugInfo(req, res),
        });
    }
    if (err instanceof AuthError) {
      return res.status(401)
        .json({
          code: 401,
          error: 'Invalid authentication',
          ...this.getDebugInfo(req, res, {
            error: err.message,
          }),
        });
    }
    if (err instanceof ValidationFailed) {
      return res.status(422)
        .json({
          code: 422,
          error: err.message,
          validator: err.errors || [],
          ...this.getDebugInfo(req, res),
        });
    }

    return res
      .status(err.code || code)
      .json({
        code: err.code || code,
        error: err.message,
        ...data,
        ...this.getDebugInfo(req, res),
      });
  }
}

module.exports = ApiController;

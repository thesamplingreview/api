const { debug } = require('../../config/app');
const {
  ModelNotFound,
  AuthError,
  ValidationFailed,
  // InvalidToken,
  S3UploadError,
} = require('../errors');

class ApiController {
  /**
   * Get paginate data
   */
  getPaginate(req) {
    let page = 1;
    let perPage = 20;

    if (req.query.page) {
      page = Math.max(Number(req.query.page), 1);
    }
    if (req.query.per_page) {
      perPage = Math.min(Math.max(Number(req.query.per_page), 1), 100);
    }
    return { page, perPage };
  }

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
   * Success CSV export
   */
  responseCsv(req, res, output) {
    res.setHeader('Content-Disposition', 'attachment; filename=data.csv');
    res.setHeader('Content-Type', 'text/csv');
    res.send(output);
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
    if (err instanceof S3UploadError) {
      return res.status(500)
        .json({
          code: 500,
          error: `s3 upload error: ${err.message}`,
          ...this.getDebugInfo(req, res),
        });
    }

    console.log(err);
    return res
      .status(err.code || code)
      .json({
        code: err.code || code,
        error: err.message,
        ...data,
        ...this.getDebugInfo(req, res, {
          errors: err.errors,
        }),
      });
  }
}

module.exports = ApiController;

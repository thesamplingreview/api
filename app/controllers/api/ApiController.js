class ApiController {
  /**
   * Success response
   */
  responseJson(req, res, data = {}) {
    return res.json({
      code: 200,
      ...data,
    });
  }

  /**
   * Success pagination
   */
  responsePaginate(req, res, data = {}) {
    return res.json({
      code: 200,
      data: data.results,
      meta: data.meta,
    });
  }

  /**
   * Error response
   */
  responseError(req, res, message, code = 500, data = {}) {
    return res.json({
      code,
      error: message,
      ...data,
    });
  }
}

module.exports = ApiController;

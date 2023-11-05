module.exports = {
  /**
   * Validator message translation
   */
  validatorMessage(message, field = '') {
    return (val, { req, path }) => {
      let attrMap = {};
      if (field && typeof field === 'object') {
        attrMap = field;
      } else {
        attrMap.field = field || path;
      }
      // eslint-disable-next-line no-underscore-dangle
      return req.__(message, attrMap);
    };
  },
};

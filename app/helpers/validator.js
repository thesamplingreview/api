module.exports = {
  /**
   * Generate validator item (standardize format)
   *
   * @param  {string}  msg
   * @param  {string}  field
   * @param  {any}  value
   * @return {object}
   */
  genValidatorItem(msg, field = '', value = null) {
    return {
      msg, field, value,
    };
  },
};

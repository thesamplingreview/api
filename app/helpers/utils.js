const { v4: uuidv4 } = require('uuid');

module.exports = {
  /**
   * Get input value by key
   *
   * @param  {object}  data
   * @param  {string}  key
   * @param  {any}  defaultVal
   * @return {any}
   */
  getInput(val, defaultVal = null) {
    if (val === undefined) {
      return defaultVal;
    }
    return val;
  },

  /**
   * Check for empty object
   *
   * @param  {object}  obj
   * @return {boolean}
   */
  isEmptyObject(obj) {
    return !obj || typeof obj !== 'object' || Object.keys(obj).length === 0;
  },

  /**
   * Generate uuidv4
   *
   * @return {string}
   */
  genUuid() {
    return uuidv4();
  },

  /**
   * Convert string to Date
   */
  toDate(str, defaultVal = null) {
    if (str) {
      const date = new Date(str);
      return !Number.isNaN(date.getTime()) ? date : defaultVal;
    }
    return defaultVal;
  },
};

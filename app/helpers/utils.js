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
   * Get object value by dotted string
   *
   * @param  {object}  obj
   * @param  {string}  path
   * @return {mixed}
   */
  getProp(obj, path) {
    return path
      .replace(/\[|\]\.?/g, '.')
      .split('.')
      .reduce((acc, key) => acc && acc[key], obj);
  },

  /**
   * Replace string variable
   *
   * @param  {string}  str
   * @param  {object}  obj
   * @return {string}
   */
  strMap(str, obj, notFound = '') {
    return str.replace(/{{(\w+)}}/g, (match, key) => this.getProp(obj, key) || notFound);
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

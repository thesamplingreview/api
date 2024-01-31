module.exports = {
  /**
   * Get env variable value with auto type conversion
   *
   * @param  {string}  val
   * @param  {string}  defaultVal
   * @return {any}
   */
  getEnv(val, defaultVal = '') {
    if (!val) {
      return defaultVal;
    }
    // type convertion
    if (val === 'true' || val === '1') {
      return true;
    }
    if (val === 'false' || val === '0') {
      return false;
    }
    return val;
  },
};

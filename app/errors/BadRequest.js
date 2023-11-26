class BadRequest extends Error {
  constructor(message) {
    super(message || 'Incorrect request format.');
    this.name = 'BadRequest';
    this.code = 400;
  }
}

module.exports = BadRequest;

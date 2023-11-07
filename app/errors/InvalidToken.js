class InvalidToken extends Error {
  constructor(message) {
    super(message || 'Invalid token');
    this.name = 'InvalidToken';
    this.code = 422;
  }
}

module.exports = InvalidToken;

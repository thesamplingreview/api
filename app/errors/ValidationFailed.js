class ValidationFailed extends Error {
  constructor(message, errors) {
    super(message || 'Validation failed');
    this.name = 'ValidationFailed';
    this.code = 422;
    this.errors = errors;
  }
}

module.exports = ValidationFailed;

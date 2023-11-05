class ValidationFailed extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationFailed';
    this.status = 422;
    this.errors = errors;
  }
}

module.exports = ValidationFailed;

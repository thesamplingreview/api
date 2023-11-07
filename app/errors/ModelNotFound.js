class ModelNotFound extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModelNotFound';
    this.code = 404;
  }
}

module.exports = ModelNotFound;

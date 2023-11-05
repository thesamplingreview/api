class ModelNotFound extends Error {
  constructor(message) {
    super(message);
    this.name = 'ModelNotFound';
    this.status = 404;
  }
}

module.exports = ModelNotFound;

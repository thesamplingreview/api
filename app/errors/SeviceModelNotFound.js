class ServiceModelNotFound extends Error {
  constructor(message) {
    super(message);
    this.name = 'ServiceModelNotFound';
    this.status = 404;
  }
}

module.exports = ServiceModelNotFound;

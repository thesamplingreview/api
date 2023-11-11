class S3UploadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'S3UploadError';
    this.code = 500;
  }
}

module.exports = S3UploadError;

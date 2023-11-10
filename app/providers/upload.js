const path = require('path');
const fs = require('fs-extra');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { ValidationFailed } = require('../errors');
const { s3 } = require('../../config/filesystem');

const s3Storage = multerS3({
  s3: new S3Client({
    credentials: {
      accessKeyId: s3.accessId,
      secretAccessKey: s3.secretKey,
    },
    region: s3.region,
  }),
  bucket: s3.bucket,
  acl: 'public-read',
  key(req, file, cb) {
    cb(null, Date.now().toString());
  },
  metadata(req, file, cb) {
    cb(null, { fieldName: file.fieldName });
  },
});

const createMemoryStorage = () => {
  return multer.memoryStorage();
};

const createLocalStorage = (folder = '') => {
  return multer.diskStorage({
    destination(req, file, cb) {
      const uploadDir = path.join(process.cwd(), 'tmp', folder);
      // creating directory
      fs.ensureDir(uploadDir)
        .then(() => cb(null, uploadDir));
    },
    filename(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });
};

const createMulter = ({
  mimeTypes,
  fileSize,
  dir,
  disk = 'tmp',
}) => {
  let storage;
  if (disk === 'local') {
    storage = createLocalStorage(dir);
  } else {
    storage = createMemoryStorage();
  }

  const upload = multer({
    storage,
    limits: {
      fileSize,
    },
    fileFilter(req, file, cb) {
      if (!mimeTypes.includes(file.mimetype)) {
        cb(new ValidationFailed('File validation failed.', [{
          field: file.fieldname,
          value: file,
          msg: req.__('validation.file_type', {
            field: file.fieldname,
            values: mimeTypes.toString(),
          }),
        }]));
      } else {
        cb(null, true);
      }
    },
  });

  return upload;
};

// as multer was unable to handle to fileSize error internal, need to rely on next handler
// @ref: https://github.com/expressjs/multer/issues/186
const createErrorHandler = ({ fileSize }) => {
  return (err, req, res, next) => {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ValidationFailed('File validation failed.', [{
        field: err.field,
        value: null,
        msg: req.__('validation.file_size', {
          field: err.field,
          size: fileSize,
        }),
      }]));
    }
    return next();
  };
};

const createSingleUpload = (field, {
  mimeTypes = [],
  fileSize = 4 * 1024 * 1024,
  dir = '',
  disk = 'tmp',
}) => {
  const multerUpload = createMulter({
    mimeTypes, fileSize, dir, disk,
  });
  const errorHandler = createErrorHandler({ fileSize });

  return [
    multerUpload.single(field),
    errorHandler,
  ];
};

module.exports = {
  createSingleUpload,
};

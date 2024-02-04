const path = require('path');
const fs = require('fs');
const formidable = require('formidable');
const imageSize = require('image-size');
// const { Upload } = require('@aws-sdk/lib-storage');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { aws: awsConfig } = require('../../config/providers');
const { S3UploadError, BadRequest } = require('../errors');

/**
 * Init s3Client
 */
const s3Client = new S3Client({
  credentials: {
    accessKeyId: awsConfig.accessId,
    secretAccessKey: awsConfig.secretKey,
  },
  region: awsConfig.region,
});

/**
 * formidable@v3 seem having some bug on form.parse on the date of writing. Hence fallback to @v2 package.
 */
/**
 * Parse formData to req.body
 *
 * @param  {array}  options.fileFields - allowed fields
 * @return {expressChain}
 */
function parseFormData({
  fileFields = [],
} = {}) {
  return async (req, res, next) => {
    // next if request is form-data
    // else formidable will causing stuck
    const contentType = req.get('Content-Type');
    if (!contentType?.startsWith('multipart/form-data')) {
      next(new BadRequest());
      return;
    }

    const form = formidable({
      multiples: true,
      uploadDir: path.join(process.cwd(), 'tmp'),
      keepExtensions: true,
      filter({ name }) {
        // allow all if '*'
        if (fileFields === '*') {
          return true;
        }
        return Array.isArray(fileFields) && fileFields.includes(name);
      },
    });

    form.parse(req, (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }

      // as express-validator unable to access req.files, hence will assign req.files into req.body
      req.body = {
        ...req.body,
        ...fields,
        ...files, // needed for express-validator
      };
      req.files = files;

      next();
    });
  };
}

/**
 * Custom validator check for uploaded file
 * - must be using inside express-validator custom()
 *
 * @param  {stirng}  options.field - field name
 * @param  {number}  options.maxFileSize
 * @param  {array}  options.mimeTypes
 * @return {expressChain}
 */
function validatorFileCheck({ field, maxFileSize, mimeTypes }) {
  return (val, { req, path: pathName }) => {
    // allow empty
    if (!val) {
      return true;
    }

    const fieldName = field || pathName;
    let error = '';
    if (!val?.filepath) {
      error = req.__('validation.required', {
        field: fieldName,
      });
    }
    if (!error && mimeTypes && !mimeTypes.includes(val.mimetype)) {
      error = req.__('validation.file_type', {
        field: fieldName,
        values: mimeTypes.toString(),
      });
    }
    if (!error && maxFileSize && val.size > maxFileSize) {
      error = req.__('validation.file_size', {
        field: fieldName,
        maxSize: `${Math.floor(maxFileSize / (1024 * 1024))}Mb`,
      });
    }

    if (error) {
      // rm tmp file
      fs.unlinkSync(val.filepath);
      throw new Error(error);
    }
    return true;
  };
}

/**
 * Get s3 URL
 */
function s3PublicUrl(key) {
  return `https://${awsConfig.bucket}.s3.${awsConfig.region}.amazonaws.com/${key}`;
}

/**
 * Remove s3 file
 */
async function s3Remove(s3Url) {
  // verify if provided path is s3 path
  const s3UrlRegex = /^https:\/\/([\w.-]+)\.s3\.([\w.-]+)\.amazonaws\.com\/(.+)$/;
  if (!s3UrlRegex.test(s3Url)) {
    return false;
  }

  try {
    const url = new URL(s3Url);
    const s3Key = url.pathname.substring(1);
    const deleteCommand = new DeleteObjectCommand({
      Bucket: awsConfig.bucket,
      Key: s3Key,
    });
    await s3Client.send(deleteCommand);

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Upload file to S3
 *
 * @param  {file}  file - formidable file object
 * @param  {string}  dir - directory
 * @param  {object}  options
 * @return {object}
 */
async function s3Upload(file, dir = '', options = {}) {
  try {
    // upload file
    const s3Key = `${dir}/${file.newFilename}`;
    const putCommand = new PutObjectCommand({
      ACL: 'public-read',
      Bucket: awsConfig.bucket,
      Key: s3Key,
      Body: fs.readFileSync(file.filepath),
      ContentType: file.mimetype,
    });
    await s3Client.send(putCommand);

    // remove existing (replace flag)
    if (options.replace) {
      await s3Remove(options.replace);
    }

    fs.unlinkSync(file.filepath);
    return s3PublicUrl(s3Key);
  } catch (err) {
    fs.unlinkSync(file.filepath);
    throw new S3UploadError(err.message);
  }
}
// async function s3Upload2(file, dir = '', options = {}) {
//   try {
//     const parallelUploads3 = new Upload({
//       client: s3Client,
//       params: {
//         ACL: 'public-read',
//         Bucket: awsConfig.bucket,
//         Key: `${dir}/${file.newFilename}`,
//         Body: fs.readFileSync(file.filepath),
//         ContentType: file.mimetype,
//       },
//       // leavePartsOnError: false,
//     });

//     const result = await parallelUploads3.done();

//     // rm tmp file
//     fs.unlinkSync(file.filepath);
//     return result;
//   } catch (e) {
//     fs.unlinkSync(file.filepath);
//     throw new S3UploadError(e.message);
//   }
// }

async function getImageDimension(filePath) {
  try {
    const dimensions = imageSize(filePath);
    return dimensions;
  } catch (err) {
    return { width: 0, height: 0 };
  }
}

module.exports = {
  parseFormData,
  validatorFileCheck,
  s3Client,
  s3PublicUrl,
  s3Upload,
  s3Remove,
  getImageDimension,
};

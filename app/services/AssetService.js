const BaseService = require('./BaseService');
const { Asset } = require('../models');
const { s3Upload, s3Remove, getImageDimension } = require('../helpers/upload');

class AssetService extends BaseService {
  constructor() {
    super(Asset);
  }

  /**
   * Verify token
   *
   * @param  {string}  type
   * @param  {string}  type
   * @param  {string}  type
   * @return {boolean}
   */
  async create(input, options = {}) {
    // eslint-disable-next-line prefer-destructuring
    const file = input.file;
    if (!file?.filepath) {
      throw new Error('Invalid file object.');
    }

    // NOTE: 'local' disk only for local testing
    let url = file.filepath;
    let disk = 'local';
    const dimensions = await getImageDimension(file.filepath);

    // upload to s3
    const useS3 = true;
    if (useS3) {
      url = await s3Upload(file, 'assets');
      disk = 's3';
    }

    const formData = {
      url,
      disk,
      filename: file.newFilename,
      ori_filename: file.originalFilename,
      caption: input.caption || null,
      mimetype: file.mimetype,
      filesize: file.size,
      width: dimensions?.width || 0,
      height: dimensions?.height || 0,
      tags: input.tags || null,
      vendor_id: input.vendor_id || null,
      created_by: input.created_by || null,
    };
    const result = await this.model.create(formData, options);

    return result;
  }
}

module.exports = AssetService;

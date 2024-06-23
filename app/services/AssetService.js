const { v4: uuidv4 } = require('uuid');
const { format } = require('date-fns');
const BaseService = require('./BaseService');
const { Asset } = require('../models');
const {
  s3Upload, s3PublicUrl, s3Remove, generateS3PresignedUrl, getImageDimension,
} = require('../helpers/upload');
const appConfig = require('../../config/app');

class AssetService extends BaseService {
  constructor() {
    super(Asset);
  }

  /**
   * Upload asset
   *
   * @param  {object}  input
   * @param  {object}  options
   * @return {boolean}
   */
  async create(input, options = {}) {
    const {
      file, caption, tags, vendor_id, created_by,
    } = input;
    if (!file?.filepath) {
      throw new Error('Invalid file object.');
    }

    // image meta
    const dimensions = await getImageDimension(file.filepath);
    let fileUrl;
    if (appConfig.uploadDisk === 's3') {
      // s3
      const dir = 'assets';
      fileUrl = await s3Upload(file, dir);
    } else {
      // local
      fileUrl = file.filepath;
    }

    const formData = {
      url: fileUrl,
      disk: appConfig.uploadDisk,
      filename: file.newFilename,
      ori_filename: file.originalFilename,
      mimetype: file.mimetype,
      filesize: file.size,
      width: dimensions?.width || 0,
      height: dimensions?.height || 0,
      caption: caption || null,
      tags: tags || null,
      vendor_id: vendor_id || null,
      created_by: created_by || null,
    };
    const result = await this.model.create(formData, options);

    return result;
  }

  /**
   * DELETE - remove
   */
  async delete(record, options) {
    const result = await record.destroy(options);

    // attempt to remove s3 also
    await s3Remove(result.url);

    return result;
  }

  /**
   * Generate s3 presigned url
   *
   * @param  {object}  input - {filename, created_by}
   * @param  {object}  options
   * @return {boolean}
   */
  async createS3PresignedAsset(input, options = {}) {
    const {
      filename, filesize, mimetype, created_by,
    } = input;

    const dir = `userupload/${format(new Date(), 'yyyy-MM-dd')}`;
    const filenameSegs = filename.split('.');
    const newFilename = `${uuidv4()}.${filenameSegs[filenameSegs.length - 1]}`;
    const presignedUrl = await generateS3PresignedUrl(newFilename, dir);
    const fileUrl = s3PublicUrl(`${dir}/${newFilename}`);

    const formData = {
      url: fileUrl,
      disk: 's3',
      filename: newFilename,
      ori_filename: filename,
      tags: 'presigned',
      mimetype: mimetype || null,
      filesize: filesize || null,
      created_by: created_by || null,
    };
    const result = await this.model.create(formData, options);

    return {
      asset: result,
      presigned_url: presignedUrl,
    };
  }
}

module.exports = AssetService;

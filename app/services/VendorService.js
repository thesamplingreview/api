const { getInput } = require('../helpers/utils');
const { s3Upload, s3Remove } = require('../helpers/upload');
const BaseService = require('./BaseService');
const { Vendor } = require('../models');

class VendorService extends BaseService {
  constructor() {
    super(Vendor);
  }

  async genWhereQuery(req) {
    const whereQuery = {};

    return whereQuery;
  }

  async create(input) {
    const formData = {
      name: input.name,
      profile: input.profile || null,
    };
    if (input.logo?.filepath) {
      const s3Url = await s3Upload(input.logo, 'vendors');
      if (s3Url) {
        formData.logo_url = s3Url;
      }
    }

    const result = await this.model.create(formData);

    return result;
  }

  async update(record, input) {
    const formData = {
      name: getInput(input.name, record.name),
      profile: getInput(input.profile, record.profile),
    };
    if (input.logo !== undefined && input.logo?.filepath) {
      const s3Url = await s3Upload(input.logo, 'vendors', {
        replace: record.logo,
      });
      if (s3Url) {
        formData.logo_url = s3Url;
      }
    } else if (input.logo !== undefined) {
      if (record.logo_url) {
        await s3Remove(record.logo_url);
      }
      formData.logo_url = null;
    }
    const result = await record.update(formData);

    return result;
  }
}

module.exports = VendorService;

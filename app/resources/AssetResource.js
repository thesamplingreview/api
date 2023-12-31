const { Asset } = require('../models');

class AssetResource {
  constructor(data) {
    this.data = data instanceof Asset ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    // @todo

    return {
      id: this.data.id,
      url: this.data.url,
      caption: this.data.caption,
      filename: this.data.filename,
      filesize: this.data.filesize,
      mimetype: this.data.mimetype,
      width: this.data.width,
      height: this.data.height,
      disk: this.data.disk,
      tags: this.data.tags,
      vendor_id: this.data.vendor_id,
      created_by: this.data.created_by,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new AssetResource(data).toJSON());
  }
}

module.exports = AssetResource;

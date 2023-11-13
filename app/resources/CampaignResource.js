const { Campaign } = require('../models');

class CampaignResource {
  constructor(data) {
    this.data = data instanceof Campaign ? data.get({ plain: true }) : data;
  }

  toJSON() {
    return this.data;
  }

  static collection(dataset) {
    return dataset.map((data) => new CampaignResource(data).toJSON());
  }
}

module.exports = CampaignResource;

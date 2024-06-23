const { CampaignReview } = require('../models');

class CampaignReviewResource {
  constructor(data) {
    this.data = data instanceof CampaignReview ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.Campaign !== undefined) {
      const CampaignResource = require('./CampaignResource');
      relations.campaign = this.data.Campaign ? new CampaignResource(this.data.Campaign) : null;
    }
    if (this.data.User !== undefined) {
      const UserResource = require('./UserResource');
      relations.creator = this.data.User ? new UserResource(this.data.User) : null;
    }
    if (this.data.CampaignReviewUploads !== undefined) {
      relations.uploads = this.data.CampaignReviewUploads.map((d) => ({
        id: d.id,
        type: d.type,
        asset_id: d.asset_id,
        url: d.url,
        name: d.Asset?.filename || null,
        size: d.Asset?.filesize || null,
        mimetype: d.Asset?.mimetype || null,
      }));
    }

    return {
      id: this.data.id,
      campaign_id: this.data.campaign_id,
      rating: this.data.rating,
      review: this.data.review,
      created_by: this.data.created_by,
      created_at: this.data.created_at,
      updated_at: this.data.updated_at,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new CampaignReviewResource(data).toJSON());
  }
}

module.exports = CampaignReviewResource;

const { CampaignEnrolment } = require('../models');
const CampaignResource = require('./CampaignResource');
const FormResource = require('./FormResource');
const UserResource = require('./UserResource');

class CampaignEnrolmentResource {
  constructor(data) {
    this.data = data instanceof CampaignEnrolment ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.Campaign !== undefined) {
      relations.campaign = this.data.Campaign ? new CampaignResource(this.data.Campaign) : null;
    }
    if (this.data.Form !== undefined) {
      relations.form = this.data.Form ? new FormResource(this.data.Form) : null;
    }
    if (this.data.User !== undefined) {
      relations.user = this.data.User ? new UserResource(this.data.User) : null;
    }

    return {
      id: this.data.id,
      campaign_id: this.data.campaign_id,
      user_id: this.data.user_id,
      form_id: this.data.form_id,
      submissions: this.data.submissions,
      created_at: this.data.created_at,
      updated_at: this.data.updated_at,
      ...relations,
    };
  }

  static collection(dataset) {
    return dataset.map((data) => new CampaignEnrolmentResource(data).toJSON());
  }
}

module.exports = CampaignEnrolmentResource;

const isDate = require('date-fns/isDate');
const isBefore = require('date-fns/isBefore');
const isAfter = require('date-fns/isAfter');
const isSameDay = require('date-fns/isSameDay');
const { Campaign } = require('../models');

class CampaignResource {
  constructor(data) {
    this.data = data instanceof Campaign ? data.get({ plain: true }) : data;
  }

  toJSON() {
    const relations = {};
    if (this.data.Vendor !== undefined) {
      const VendorResource = require('./VendorResource');
      relations.vendor = this.data.Vendor ? new VendorResource(this.data.Vendor) : null;
    }
    if (this.data.Form !== undefined) {
      const FormResource = require('./FormResource');
      relations.form = this.data.Form ? new FormResource(this.data.Form) : null;
    }
    if (this.data.Products !== undefined) {
      const ProductResource = require('./ProductResource');
      relations.products = this.data.Products.map((d) => new ProductResource(d));
    }
    if (this.data.Users !== undefined) {
      const UserResource = require('./UserResource');
      relations.users = this.data.Users.map((d) => new UserResource(d));
    }
    if (this.data.CampaignEnrolments !== undefined) {
      const CampaignEnrolmentResource = require('./CampaignEnrolmentResource');
      relations.enrolments = this.data.CampaignEnrolments.map((d) => new CampaignEnrolmentResource(d));
    }
    if (this.data.CampaignReviews !== undefined) {
      const CampaignReviewResource = require('./CampaignReviewResource');
      relations.reviews = this.data.CampaignReviews.map((d) => new CampaignReviewResource(d));
    }

    const counts = {};
    if (this.data.enrolmentsCount !== undefined) {
      counts.enrolments_count = this.data.enrolmentsCount;
    }
    if (this.data.reviewsCount !== undefined) {
      counts.reviews_count = this.data.reviewsCount;
    }

    return {
      id: this.data.id,
      slug: this.data.slug,
      name: this.data.name,
      description: this.data.description,
      intro_title: this.data.intro_title,
      intro_description: this.data.intro_description,
      presubmit_title: this.data.presubmit_title,
      presubmit_description: this.data.presubmit_description,
      postsubmit_title: this.data.postsubmit_title,
      postsubmit_description: this.data.postsubmit_description,
      meta_title: this.data.meta_title,
      meta_description: this.data.meta_description,
      meta_keywords: this.data.meta_keywords,
      review_type: this.data.review_type,
      review_instruction: this.data.review_instruction,
      review_cta: this.data.review_cta,
      cover_url: this.data.cover_url,
      background_url: this.data.background_url,
      start_date: this.data.start_date,
      end_date: this.data.end_date,
      status: this.data.status,
      state: this.generateStateAttr(this.data),
      highlight: this.data.highlight,
      pos: this.data.pos,
      vendor_id: this.data.vendor_id,
      form_id: this.data.form_id,
      created_at: this.data.created_at,
      updated_at: this.data.updated_at,
      ...counts,
      ...relations,
    };
  }

  generateStateAttr(data) {
    const startDt = isDate(data.start_date) ? new Date(data.start_date) : null;
    const endDt = isDate(data.end_date) ? new Date(data.end_date) : null;
    const now = new Date();
    if (startDt && endDt) {
      if (isBefore(startDt, now) && isBefore(endDt, now)) {
        return 'past';
      }
      if (isAfter(startDt, now) && isAfter(endDt, now)) {
        return 'coming';
      }
      return 'current';
    }
    if (startDt) {
      if (isSameDay(startDt, now)) {
        return 'current';
      }
      if (isAfter(startDt, now)) {
        return 'coming';
      }
      return 'past';
    }
    if (endDt) {
      if (isSameDay(endDt, now)) {
        return 'current';
      }
      if (isAfter(endDt, now)) {
        return 'coming';
      }
      return 'past';
    }
    return null;
  }

  static collection(dataset) {
    return dataset.map((data) => new CampaignResource(data).toJSON());
  }
}

module.exports = CampaignResource;

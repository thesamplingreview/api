const BaseCsv = require('./BaseCsv');
const {
  Campaign, CampaignReviewUpload, User,
} = require('../models');
const ReviewService = require('../services/ReviewService');

class ReviewCsv extends BaseCsv {
  constructor({ filter }) {
    super();

    this.filter = filter;
  }

  columns() {
    return [
      {
        key: 'Campaign.name',
        header: 'Campaign',
      },
      {
        key: 'User.name',
        header: 'User',
      },
      {
        key: 'User.email',
        header: 'Email',
      },
      {
        key: 'User.contact',
        header: 'Contact Number',
      },
      {
        key: 'rating',
        header: 'Rating',
      },
      {
        key: 'review',
        header: 'Review',
      },
      {
        key: 'CampaignReviewUploads.url',
        header: 'Upload',
      },
      {
        key: 'created_at',
        header: 'Date',
      },
    ];
  }

  async data() {
    const reviewService = new ReviewService();
    const query = {
      where: this.filter,
      order: [['id', 'ASC']],
      include: [
        {
          model: Campaign,
          attributes: ['name', 'slug'],
          required: true,
        },
        {
          // @NOTE: using raw will causing multiple rows if having multiple uploads
          model: CampaignReviewUpload,
          attributes: ['url'],
        },
        {
          model: User,
          attributes: ['name', 'email', 'contact'],
        },
      ],
      raw: true,
    };
    const results = await reviewService.findAll(query);
    return results;
  }
}

module.exports = ReviewCsv;

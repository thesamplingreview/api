const ApiController = require('./ApiController');
const { sequelize } = require('../models');
const AssetService = require('../services/AssetService');
const AssetResource = require('../resources/AssetResource');
const { sendMail, sendMailUsingTmpl } = require('../helpers/mailer');
const { sendSMS } = require('../helpers/sms');

class UtilsController extends ApiController {
  /**
   * POST - send email
   */
  async sendEmail(req, res) {
    const formdata = {
      to: req.body.to,
      subject: req.body.subject,
      content: req.body.content,
      useHtml: req.body.use_html,
      from: req.body.from,
      fromName: req.body.fromName,
    };

    try {
      const sent = await sendMail(formdata);
      return this.responseJson(req, res, {
        data: sent || false,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  /**
   * POST - upload
   */
  async uploadAsset(req, res) {
    // define allowed fields
    const formData = {
      file: req.body.file,
      caption: req.body.caption,
      // vendor_id: req.body.vendor_id,
      tags: req.body.tags,
      created_by: req.user.id,
    };

    const assetService = new AssetService();

    // DB update
    const t = await sequelize.transaction();
    try {
      const result = await assetService.create(formData, { transaction: t });

      await t.commit();
      return this.responseJson(req, res, {
        data: new AssetResource(result),
        // data: result,
      });
    } catch (err) {
      await t.rollback();
      return this.responseError(req, res, err);
    }
  }

  async sendTestEmail(req, res) {
    const formdata = {
      to: req.body.to,
      subject: '[TEST] Email Testing',
      throwErr: true,
    };
    if (req.body.use_content) {
      formdata.type = 'content';
      formdata.content = 'This is test message';
      formdata.useHtml = true;
    } else {
      formdata.type = 'tmpl';
      formdata.templateId = req.body.template_id;
      formdata.templateData = {
        user_name: 'TEST',
        user_email: 'test@email.com',
        cta_link: 'https://qutebox.com',
      };
    }

    try {
      const result = formdata.type === 'content' ? await sendMail(formdata) : await sendMailUsingTmpl(formdata);

      return this.responseJson(req, res, {
        data: result,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }

  async sendTestSMS(req, res) {
    const formdata = {
      to: req.body.to,
      message: 'This is SMS Test Message',
      throwErr: true,
    };

    try {
      const result = await sendSMS(formdata);

      return this.responseJson(req, res, {
        data: result,
      });
    } catch (err) {
      return this.responseError(req, res, err);
    }
  }
}

module.exports = UtilsController;

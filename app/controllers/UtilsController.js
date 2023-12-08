const ApiController = require('./ApiController');
const { sendMail } = require('../helpers/mailer');

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
}

module.exports = UtilsController;

const path = require('path');
const formidable = require('formidable');

/**
 * formidable@v3 seem having some bug on form.parse on the date of writing. Hence fallback to @v2 package.
 */
const handleFormData = async (req, res, next) => {
  const form = formidable({
    // multiple: true,
    uploadDir: path.join(process.cwd(), 'tmp'),
    keepExtensions: true,
  });

  try {
    const data = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          reject(err);
        }
        resolve({ fields, files });
      });
    });

    req.body = {
      ...req.body,
      ...data.fields,
    };
    req.files = data.files;

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = handleFormData;

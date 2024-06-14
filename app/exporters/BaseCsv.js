const { stringify } = require('csv-stringify');

class BaseCsv {
  async toCsv() {
    const data = await this.data();

    return new Promise((resolve, reject) => {
      stringify(data, {
        header: true,
        columns: this.columns(),
        cast: {
          date(value) {
            return value.toLocaleString('en-GB');
          },
          object(value) {
            return JSON.stringify(value);
          },
        },
      }, (err, output) => {
        if (err) {
          reject(err);
        }
        resolve(output);
      });
    });
  }
}

module.exports = BaseCsv;

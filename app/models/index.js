const fs = require('fs');
const path = require('path');
const { DataTypes, Sequelize } = require('sequelize');
const { db } = require('../../config/database');
const appConfig = require('../../config/app');

const sequelize = new Sequelize(
  db.database,
  db.username,
  db.password,
  {
    host: db.host,
    dialect: 'mysql',
    timezone: appConfig.timezone,
    logging: appConfig.env === 'local',
  },
);

fs.readdirSync(__dirname)
  .filter((file) => file !== 'index.js' && file.endsWith('.js'))
  .forEach((file) => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const model = require(path.join(__dirname, file))(sequelize, DataTypes);
    db[model.name] = model;
  });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
  if (db[modelName].scopes) {
    db[modelName].scopes(db);
  }
});

module.exports = db;

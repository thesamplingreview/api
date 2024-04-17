// Postman to Swagger generator
const postmanToOpenApi = require('postman-to-openapi');

const postmanCollection = './tools/postman_collection.json';
const outputFile = './swagger.json';

postmanToOpenApi(postmanCollection, outputFile, {
  defaultTag: 'General',
  outputFormat: 'json',
})
  .then(() => {
    console.log(`API definitions generated at ${outputFile}!`);
  })
  .catch((err) => {
    console.log(err);
  });

## DB Migration

Runing latest migration, this will check for latest migration files and perform DB update accordingly.

`npx sequelize-cli db:migrate`

Revert the migration to last version.

`npx sequelize-cli db:migrate:undo`

Running DB seeders.

`npx sequelize-cli db:seed:all`

## Swagger API Docs

URL: `/docs`

Swagger definitions (`swagger.json`) will be generated based on postman collection (`/tools/postman_collection.json`).

Convert post collection to OpenApi definitions.

`npm run build:docs`

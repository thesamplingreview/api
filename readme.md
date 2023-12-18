## DB Migration

Runing latest migration, this will check for latest migration files and perform DB update accordingly.

`npx sequelize-cli db:migrate`

Revert the migration to last version.

`npx sequelize-cli db:migrate:undo`

Running DB seeders.

`npx sequelize-cli db:seed:all`

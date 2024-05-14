/**
 * NOTE:
 *
 * Permissions here control of UI only, not API nor routing!!
 */
const allPermissions = [
  // campaigns
  'campaigns:view',
  'campaigns:create',
  'campaigns:edit',
  'campaigns:delete',
  'campaigns:workflow',
  // enrolments
  'enrolments:view',
  'enrolments:create',
  'enrolments:edit',
  'enrolments:delete',
  // forms
  'forms:view',
  'forms:create',
  'forms:edit',
  'forms:delete',
  // products
  'products:view',
  'products:create',
  'products:edit',
  'products:delete',
  // reviews
  'reviews:view',
  'reviews:create',
  'reviews:edit',
  'reviews:delete',
  // users
  'users:view',
  'users:create',
  'users:edit',
  'users:delete',
  // vendors
  'vendors:view',
  'vendors:create',
  'vendors:edit',
  'vendors:delete',
  // admins
  'admins:view',
  'admins:create',
  'admins:edit',
  'admins:password',
  'admins:delete',
  // workflows
  // 'workflows:view',
  // 'workflows:create',
  // 'workflows:edit',
  // 'workflows:delete',
  // system
  'system:view',
  // report
  'report:enrolments',
  'report:signup',
];

function genModulePermissions(modules) {
  return allPermissions.filter((permission) => {
    const moduleName = permission.split(':')[0];
    return modules.includes(moduleName);
  });
}

module.exports = {
  all: allPermissions,
  admin: allPermissions,
  vendor: [
    ...genModulePermissions([
      'campaigns',
      'products',
      'forms',
    ]),
    'enrolments:view',
    'enrolments:edit',
    'reviews:view',
    'users:view',
    'admins:view',
    'admins:edit',
    'report:enrolments',
  ],
};

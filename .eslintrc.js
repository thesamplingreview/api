module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'airbnb-base',
  ],
  globals: {},
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  // settings: {
  //   'import/resolver': {
  //     alias: {
  //       map: [['@', './resources/js']],
  //     },
  //   },
  // },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'max-len': 'off',
    'no-alert': 'off',
    'no-param-reassign': 'off',
    'no-underscore-dangle': 'off',
    'camelcase': 'off',
    'import/newline-after-import': 'off',
    'arrow-body-style': 'off',
    'class-methods-use-this': 'off',
  },
};

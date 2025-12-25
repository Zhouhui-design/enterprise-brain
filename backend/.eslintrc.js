module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['prettier', 'node'],
  rules: {
    'prettier/prettier': 'error',
    'node/no-unpublished-require': 'off',
    'node/no-missing-require': 'off',
    'no-console': 'warn',
    'no-unused-vars': 'warn',
    'no-undef': 'error',
  },
};

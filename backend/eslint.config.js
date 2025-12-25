const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2021,
        sourceType: 'commonjs',
      },
      globals: {
        // Node.js globals
        __dirname: 'writable',
        __filename: 'writable',
        require: 'writable',
        module: 'writable',
        exports: 'writable',
        console: 'writable',
        process: 'writable',
        Buffer: 'writable',
        setInterval: 'writable',
        clearInterval: 'writable',
        setTimeout: 'writable',
        clearTimeout: 'writable',
        URLSearchParams: 'writable',
        // Jest globals
        test: 'writable',
        expect: 'writable',
        describe: 'writable',
        it: 'writable',
        beforeEach: 'writable',
        afterEach: 'writable',
        beforeAll: 'writable',
        afterAll: 'writable',
        // Custom globals from server.js
        logger: 'writable',
      },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': 'warn',
      'no-undef': 'error',
    },
  },
  {
    ignores: [
      'node_modules/',
      'logs/',
      'data/',
      'uploads/',
      '.eslintrc.js',
      'test_*.js',
      'test-*.js',
      '*test*.js',
      'tests/',
      '*.test.js',
      'verify_*.js',
      'update_*.js',
      '补充*.js',
      '补推送*.js',
      '测试*.js',
      'websocket/',
      'scripts/',
      'migrations/',
    ],
  },
];

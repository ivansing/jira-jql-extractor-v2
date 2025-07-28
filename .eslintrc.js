module.exports = {
    env: {
        node: true,
        es2021: true
    },
    extends: [
        'eslint:recommended'
    ],
    parserOptions: {
        ecmaVersion: 12,
        sourceType: 'module'
    },
    rules: {
        'eqeqeq': ['error', 'always'],
        'no-eval': 'error',
        'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
        'semi': ['error', 'always'],
        'no-var': 'error',
        'prefer-const': 'error',
        'no-process-exit': 'off',
        // Disable strict formatting rules
        'indent': 'off',
        'quotes': 'off'
    }
};
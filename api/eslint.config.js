import js from '@eslint/js';
import globals from 'globals';

// Rules follow the module manual (LU5): strict equality and braces on every block.
export default [
    { ignores: ['node_modules/', 'coverage/', 'postman/'] },
    js.configs.recommended,
    {
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.node },
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-console': 'off',
            eqeqeq: 'error',
            curly: 'error',
        },
    },
];

/* ref
https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file
https://eslint.org/docs/latest/rules/eqeqeq
https://eslint.org/docs/latest/rules/curly
*/

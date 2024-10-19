import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
	{
		files: ['**/*.{js,mjs,cjs,ts,tsx,mts,cts}'],
		languageOptions: {
			globals: {
				...globals.node,
			},
		},
	},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			// General rules
			'no-console': ['warn', { allow: ['warn', 'error'] }],
			'no-debugger': 'warn',
			'no-unused-vars': 'off', // Turned off in favor of TypeScript's rule
			'semi': ['error', 'always'],
			'quotes': ['error', 'single'],
			'indent': ['error', 'tab', { 'SwitchCase': 1 }],
			'comma-dangle': ['error', 'always-multiline'],
			'no-multiple-empty-lines': ['error', { 'max': 2, 'maxEOF': 1 }],
			'eol-last': ['error', 'always'],

			// TypeScript-specific rules
			'@typescript-eslint/no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',

			// Best practices
			'eqeqeq': ['error', 'always', { 'null': 'ignore' }],
			'no-var': 'error',
			'prefer-const': 'error',

		},
	},
];

import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import noLoopsPlugin from 'eslint-plugin-no-loops';
import importPlugin from 'eslint-plugin-import';

export default [
  eslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        __filename: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        require: 'readonly',
        exports: 'writable',
        Buffer: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        setImmediate: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        performance: 'readonly'
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      'prettier': prettierPlugin,
      'no-loops': noLoopsPlugin,
      'import': importPlugin,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-loops/no-loops': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      
      // Import sorting rules
      'import/order': ['error', {
        'groups': [
          'builtin',    // Node.js built-in modules
          'external',   // npm packages
          'internal',   // paths aliased in tsconfig
          'parent',     // parent directories
          'sibling',    // same or sibling directories
          'index',      // index of the current directory
          'object',     // object imports
          'type'        // type imports
        ],
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
      'sort-imports': ['error', {
        'ignoreCase': true,
        'ignoreDeclarationSort': true, // because we use import/order
        'ignoreMemberSort': false,
        'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
        'allowSeparatedGroups': true
      }]
    }
  },
  {
    ignores: [
      '**/dist/**', 
      '**/node_modules/**', 
      '**/*.d.ts', 
      '**/bin/**',
      ".scripts/**",
      'site/**', 
      'mods/webui/**', 
      'mods/**/*.test.ts', 
      'mods/**/*.proto', 
      '**/generated/**', 
      'mods/sdk/public/fonoster.min.js',
      'mods/**/*.integration.ts'
    ]
  }
];
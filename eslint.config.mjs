/**
 * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)
 * http://github.com/fonoster/fonoster
 *
 * This file is part of Fonoster
 *
 * Licensed under the MIT License (the "License");
 * you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 *    https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import noLoopsPlugin from 'eslint-plugin-no-loops';
import importPlugin from 'eslint-plugin-import';
import headerPlugin from 'eslint-plugin-header'; export default [
  eslint.configs.recommended,
  {
    files: ['mods/**/*.ts', 'mods/**/*.tsx'],
    plugins: {
      'header': headerPlugin
    },
    rules: {
      'header/header': [
        'error',
        'block',
        [
          '*',
          ' * Copyright (C) 2025 by Fonoster Inc (https://fonoster.com)',
          ' * http://github.com/fonoster/fonoster',
          ' *',
          ' * This file is part of Fonoster',
          ' *',
          ' * Licensed under the MIT License (the "License");',
          ' * you may not use this file except in compliance with',
          ' * the License. You may obtain a copy of the License at',
          ' *',
          ' *    https://opensource.org/licenses/MIT',
          ' *',
          ' * Unless required by applicable law or agreed to in writing, software',
          ' * distributed under the License is distributed on an "AS IS" BASIS,',
          ' * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.',
          ' * See the License for the specific language governing permissions and',
          ' * limitations under the License.',
          ' '
        ]
      ]
    }
  },
  {
    files: ['mods/**/*.ts', 'mods/**/*.tsx'],
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
      'header': headerPlugin
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
      'import/order': ['error', {
        'groups': [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type'
        ],
        'alphabetize': {
          'order': 'asc',
          'caseInsensitive': true
        }
      }],
      'sort-imports': ['error', {
        'ignoreCase': true,
        'ignoreDeclarationSort': true,
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
      '**/.react-router/**',
      '**/*.d.ts',
      '**/bin/**',
      ".scripts/**",
      'site/**',
      'mods/dashboard/**',
      'mods/**/*.test.ts',
      'mods/**/*.proto',
      '**/generated/**',
      'mods/sdk/public/fonoster.min.js',
      'mods/**/*.integration.ts',
      // TODO: Avoid ignoring this file after we fix the issue addign the headers
      'mods/autopilot/src/server.ts',
      'mods/apiserver/src/index.ts',
      'mods/mcp/src/index.ts'
    ]
  }
];

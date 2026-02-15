import { fileURLToPath } from 'node:url';
import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';
import stylistic from '@stylistic/eslint-plugin';
import prettier from 'eslint-config-prettier';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  prettier,
  ...svelte.configs.prettier,
  {
    plugins: {
      '@stylistic': stylistic
    },
    languageOptions: {
      globals: {
        ...globals.browser
      }
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: ['.svelte'],
        parser: ts.parser,
        svelteConfig
      }
    }
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'svelte/no-navigation-without-resolve': 'off',
      '@stylistic/arrow-parens': ['error', 'always'],
      'no-console': 'error',
      'no-undef': 'off'
    }
  },
  {
    files: ['**/*.ts', '**/*.js'],
    rules: {
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/comma-dangle': ['error', 'never']
    }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
    rules: {
      'svelte/no-spaces-around-equal-signs-in-attribute': 'error',
      'svelte/spaced-html-comment': ['error', 'always'],
      'svelte/sort-attributes': 'error',
      'svelte/no-at-html-tags': 'off',
      'svelte/derived-has-same-inputs-outputs': ['error'],
      'svelte/html-closing-bracket-new-line': ['error', { singleline: 'never', multiline: 'always' }],
      'svelte/prefer-class-directive': ['error', { prefer: 'always' }],
      'svelte/no-dom-manipulating': 'error',
      'svelte/valid-style-parse': 'error',
      'svelte/no-add-event-listener': 'error',
      'svelte/require-optimized-style-attribute': 'error',
      'svelte/require-stores-init': 'error'
    }
  }
);

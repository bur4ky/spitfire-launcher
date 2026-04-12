import type { Config } from 'prettier';

const config: Config = {
  useTabs: false,
  tabWidth: 2,
  singleQuote: true,
  trailingComma: 'none',
  printWidth: 120,
  plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss', '@ianvs/prettier-plugin-sort-imports'],
  overrides: [
    {
      files: '*.svelte',
      options: {
        parser: 'svelte'
      }
    }
  ],
  tailwindStylesheet: './src/routes/layout.css',
  importOrder: [
    '^svelte(.*)',
    '<THIRD_PARTY_MODULES>',
    '^@lucide/svelte/(.*)$',
    '^@tauri-apps/(.*)$',
    '^\\$lib/(.*)$',
    '^\\$components/(.*)$',
    '^\\$types/(.*)$',
    '^[./]'
  ]
};

export default config;

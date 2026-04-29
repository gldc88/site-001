// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import vue from '@astrojs/vue';

import cloudflare from '@astrojs/cloudflare';

const site = process.env.PUBLIC_SITE_URL || process.env.CF_PAGES_URL || 'https://www.goldlinedc.com';

// https://astro.build/config
export default defineConfig({
  site,

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), vue()],
  adapter: cloudflare()
});
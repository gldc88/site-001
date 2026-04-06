// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import vue from '@astrojs/vue';

import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // REPLACE WITH REAL SUBDOMAIN
  site: 'https://PLACEHOLDER-SUBDOMAIN.YOURDOMAIN.COM',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), vue()],
  adapter: cloudflare()
});
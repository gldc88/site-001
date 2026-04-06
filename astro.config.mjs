// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

import vue from '@astrojs/vue';

// https://astro.build/config
export default defineConfig({
  site: 'https://PLACEHOLDER-SUBDOMAIN.YOURDOMAIN.COM', // REPLACE WITH REAL SUBDOMAIN
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react(), vue()]
});
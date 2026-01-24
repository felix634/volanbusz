// astro.config.mjs
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // A Tailwindet mostantól Vite pluginként töltjük be, nem Astro integrációként
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [react()],
});
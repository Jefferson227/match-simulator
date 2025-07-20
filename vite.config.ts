import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Use dynamic import for tailwindcss to avoid ESM issues
export default defineConfig(async () => {
  // Import tailwindcss dynamically
  const tailwindcss = await import('@tailwindcss/vite');

  return {
    resolve: {
      alias: [
        { find: '@features', replacement: path.resolve(__dirname, 'src/features') },
        { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
        { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
        { find: '@contexts', replacement: path.resolve(__dirname, 'src/contexts') },
        { find: '@services', replacement: path.resolve(__dirname, 'src/services') }
      ]
    },
    plugins: [
      reactPlugin(),
      tailwindcss.default(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Match Simulator',
          short_name: 'MatchSim',
          description: 'Football match simulator',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/icons/android-chrome-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/android-chrome-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
  };
});

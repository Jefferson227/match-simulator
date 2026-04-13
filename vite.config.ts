import { defineConfig } from 'vite';
import reactPlugin from '@vitejs/plugin-react-swc';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// Use dynamic import for tailwindcss to avoid ESM issues
export default defineConfig(async () => {
  // Import tailwindcss dynamically
  const tailwindcss = await import('@tailwindcss/vite');
  const srcDir = fileURLToPath(new URL('./src', import.meta.url));

  return {
    resolve: {
      alias: [
        { find: /^~domain\//, replacement: `${srcDir}/domain/` },
        { find: /^~game-engine\//, replacement: `${srcDir}/game-engine/` },
        { find: /^~infrastructure\//, replacement: `${srcDir}/infrastructure/` },
        { find: /^~presentation\//, replacement: `${srcDir}/presentation/` },
        { find: /^~reducers\//, replacement: `${srcDir}/reducers/` },
        { find: /^~services\//, replacement: `${srcDir}/services/` },
        { find: /^~use-cases\//, replacement: `${srcDir}/use-cases/` },
        { find: /^~utils\//, replacement: `${srcDir}/utils/` },
      ],
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

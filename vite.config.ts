import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import svgr from 'vite-plugin-svgr';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { version } from './package.json';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: env.VITE_BASE_PATH ?? '/',
    plugins: [
      react(),
      tailwindcss(),
      svgr({
        svgrOptions: {
          exportType: 'named',
          ref: true,
        },
        include: '**/*.svg',
      }),
    ],
    build: {
      outDir: 'build',
    },
    define: {
      __APP_VERSION__: JSON.stringify(version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@routes': path.resolve(__dirname, './src/routes'),
        '@store': path.resolve(__dirname, './src/store'),
        '@styles': path.resolve(__dirname, './src/styles'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@features': path.resolve(__dirname, './src/features'),
        '@schemas': path.resolve(__dirname, './src/schemas'),
        '@types': path.resolve(__dirname, './src/types'),
        '@services': path.resolve(__dirname, './src/services'),
        '@images': path.resolve(__dirname, './src/assets/images'),
        '@svgs': path.resolve(__dirname, './src/assets/svgs'),
        '@lib': path.resolve(__dirname, './src/lib'),
      },
    },
  };
});

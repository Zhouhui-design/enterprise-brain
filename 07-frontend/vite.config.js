import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    open: '/auth/login', // 自动打开登录页面
    proxy: {
      // 代理后端API请求到Node.js后端
      '/api': {
        target: 'http://localhost:3005', // Node.js后端服务地址
        changeOrigin: true,
        // 不需要rewrite，保持/api路径
      }
    }
  }
});

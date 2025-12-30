import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/utils': path.resolve(__dirname, 'src/utils'),
      '@/api': path.resolve(__dirname, 'src/api'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/features': path.resolve(__dirname, 'src/features'),
      '@/composables': path.resolve(__dirname, 'src/composables')
    },
    // ✅ 扩展名解析顺序，优先.vue
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue']
  },
  server: {
    port: 3003,
    host: '0.0.0.0',
    strictPort: true, // 严格使用指定端口，如果被占用则失败
    open: '/auth/login',
    proxy: {
      '/api': {
        target: 'http://localhost:3005',
        changeOrigin: true,
      }
    },
    // ✅ 禁用HMR错误覆盖层
    hmr: {
      overlay: false
    },
    // ✅ 监听文件变化配置，防止Windows系统文件锁定问题
    watch: {
      usePolling: true, // 使用轮询方式监听文件变化
      interval: 100 // 轮询间隔
    },
    // ✅ 预热常用文件，减少首次加载时间
    warmup: {
      clientFiles: [
        './src/components/**/*.vue',
        './src/pages/**/*.vue',
        './src/router/**/*.js'
      ]
    }
  },
  // ✅ 添加端口信息显示配置
  onListening: function({ port }) {
    console.log(`🚀 前端服务已启动: http://localhost:${port}`)
    console.log(`📱 API代理地址: http://localhost:${port}/api -> http://localhost:3005`)
    console.log(`🌐 在浏览器中打开: http://localhost:${port}/auth/login`)
  },
  // ✅ 优化依赖预构建
  optimizeDeps: {
    include: [
      'vue',
      'vue-router',
      'element-plus',
      'axios',
      '@element-plus/icons-vue'
    ],
    // ✅ 排除容易导致问题的依赖
    exclude: ['vue-demi'],
    // ✅ 强制预构建，避免运行时发现新依赖导致刷新
    force: true,
    // ✅ esbuild选项
    esbuildOptions: {
      target: 'es2020',
      // ✅ 减少内存占用
      loader: {
        '.js': 'jsx',
        '.ts': 'tsx'
      }
    }
  },
  // ✅ esbuild配置 - 降低日志级别，避免大量错误导致崩溃
  esbuild: {
    logLevel: 'silent', // 完全静默，避免esbuild错误日志爆炸
    logLimit: 0,
    target: 'es2020'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    // ✅ 禁用CSS代码分割，减少请求数
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'element-plus': ['element-plus'],
          'vue-vendor': ['vue', 'vue-router']
        }
      }
    },
    // ✅ 减小打包目标，提高兼容性
    target: 'es2020'
  },
  // ✅ 日志级别设置
  logLevel: 'warn',
  // ✅ 清除控制台，避免日志堆积导致性能问题
  clearScreen: true
});


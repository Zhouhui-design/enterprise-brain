// vite.config.js
import { defineConfig } from "file:///home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/node_modules/vite/dist/node/index.js";
import vue from "file:///home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
var __vite_injected_original_dirname = "/home/sardenesy/ai_workspaces/ai_desktop_3/07-frontend";
var vite_config_default = defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "src")
    }
  },
  server: {
    port: 3003,
    host: "0.0.0.0",
    open: "/auth/login",
    // 自动打开登录页面
    proxy: {
      // 代理后端API请求到Node.js后端
      "/api": {
        target: "http://localhost:3005",
        // Node.js后端服务地址
        changeOrigin: true
        // 不需要rewrite，保持/api路径
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9zYXJkZW5lc3kvYWlfd29ya3NwYWNlcy9haV9kZXNrdG9wXzMvMDctZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9ob21lL3NhcmRlbmVzeS9haV93b3Jrc3BhY2VzL2FpX2Rlc2t0b3BfMy8wNy1mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vaG9tZS9zYXJkZW5lc3kvYWlfd29ya3NwYWNlcy9haV9kZXNrdG9wXzMvMDctZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCB2dWUgZnJvbSAnQHZpdGVqcy9wbHVnaW4tdnVlJztcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnO1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3Z1ZSgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICdzcmMnKVxuICAgIH1cbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogMzAwMyxcbiAgICBob3N0OiAnMC4wLjAuMCcsXG4gICAgb3BlbjogJy9hdXRoL2xvZ2luJywgLy8gXHU4MUVBXHU1MkE4XHU2MjUzXHU1RjAwXHU3NjdCXHU1RjU1XHU5ODc1XHU5NzYyXG4gICAgcHJveHk6IHtcbiAgICAgIC8vIFx1NEVFM1x1NzQwNlx1NTQwRVx1N0FFRkFQSVx1OEJGN1x1NkM0Mlx1NTIzME5vZGUuanNcdTU0MEVcdTdBRUZcbiAgICAgICcvYXBpJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjMwMDUnLCAvLyBOb2RlLmpzXHU1NDBFXHU3QUVGXHU2NzBEXHU1MkExXHU1NzMwXHU1NzQwXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgLy8gXHU0RTBEXHU5NzAwXHU4OTgxcmV3cml0ZVx1RkYwQ1x1NEZERFx1NjMwMS9hcGlcdThERUZcdTVGODRcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFvVixTQUFTLG9CQUFvQjtBQUNqWCxPQUFPLFNBQVM7QUFDaEIsT0FBTyxVQUFVO0FBRmpCLElBQU0sbUNBQW1DO0FBS3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxJQUFJLENBQUM7QUFBQSxFQUNmLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLEtBQUs7QUFBQSxJQUNwQztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE1BQU07QUFBQTtBQUFBLElBQ04sT0FBTztBQUFBO0FBQUEsTUFFTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUE7QUFBQSxRQUNSLGNBQWM7QUFBQTtBQUFBLE1BRWhCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=

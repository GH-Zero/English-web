import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { createProgressApi } from './progress-api.js'

// 学习记录保存到项目里的 .data/progress.json，换窗口、换浏览器都能读到
const progressApi = createProgressApi(fileURLToPath(new URL('./.data/', import.meta.url)))

const progressPlugin = {
  name: 'progress-storage',
  configureServer(server) { server.middlewares.use(progressApi) },
  configurePreviewServer(server) { server.middlewares.use(progressApi) },
}

export default defineConfig({
  plugins: [react(), progressPlugin],
  // 记录文件变化不需要触发页面刷新
  server: { watch: { ignored: ['**/.data/**'] } },
})

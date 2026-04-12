import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('echarts') || id.includes('zrender')) return 'vendor-charts'
          if (id.includes('@ant-design/icons')) return 'vendor-antd-icons'
          if (id.includes('rc-')) return 'vendor-antd-rc'
          if (id.includes('antd')) return 'vendor-antd-core'
          if (id.includes('react')) return 'vendor-react'
          return 'vendor-misc'
        },
      },
    },
  },
})

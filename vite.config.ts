import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      // xtts-server/venv (Python packages) and TTS-dev (vendored Coqui TTS
      // library) have tens of thousands of files irrelevant to the frontend
      // and blow past the OS inotify watch limit if Vite tries to watch them.
      ignored: ['**/xtts-server/venv/**', '**/TTS-dev/**'],
    },
  },
})

import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import { workspaceAliases } from '../../workspace-aliases.mjs';

export default defineConfig({
  server: {
    port: 3000,
  },
  resolve: {
    alias: workspaceAliases(),
  },
  plugins: [
    tailwindcss(),
    tanstackStart({ srcDirectory: 'src' }),
    viteReact(),
    nitro(),
  ],
});

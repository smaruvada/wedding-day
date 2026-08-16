import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], server: { proxy: { '/admin': 'http://localhost:3001', '/auth': 'http://localhost:3001', '/tasks': 'http://localhost:3001', '/questions': 'http://localhost:3001', '/members': 'http://localhost:3001', '/uploads': 'http://localhost:3001' } } });

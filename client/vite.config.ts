import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/admin": "http://localhost:3001",
      "/auth": "http://localhost:3001",
      "/tasks": {
        target: "http://localhost:3001",
        bypass: (request) =>
          request.method === "GET" &&
          request.headers.accept?.includes("text/html") &&
          /^\/tasks\/[^/]+\/?$/.test(request.url ?? "")
            ? "/index.html"
            : undefined,
      },
      "/questions": "http://localhost:3001",
      "/members": "http://localhost:3001",
      "/uploads": "http://localhost:3001",
    },
  },
});

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
                bypass: function (request) {
                    var _a, _b;
                    return request.method === "GET" &&
                        ((_a = request.headers.accept) === null || _a === void 0 ? void 0 : _a.includes("text/html")) &&
                        /^\/tasks\/[^/]+\/?$/.test((_b = request.url) !== null && _b !== void 0 ? _b : "")
                        ? "/index.html"
                        : undefined;
                },
            },
            "/questions": "http://localhost:3001",
            "/members": "http://localhost:3001",
            "/uploads": "http://localhost:3001",
        },
    },
});

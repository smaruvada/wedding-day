# Wedding Day

Wedding-party task delegation app built with React, Express, PostgreSQL, Drizzle, and Vitest.

## Local development

```bash
cp .env.example server/.env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

The client runs at `http://localhost:5173`; the API runs at `http://localhost:3001`.

## Production deployment

The production container serves the built React client and API from one origin on port `3001`. It applies database migrations on startup, stores uploads in a persistent volume, and requires a production JWT secret of at least 32 characters. Migrations ensure an admin account is available on every deployment: username `admin`, password `Wedding123!`. Change this password from the Admin page immediately after first sign-in.

1. Copy and complete the production environment file:

   ```bash
   cp .env.production.example .env.production
   ```

2. Generate a strong JWT secret and unique database password. Set `CLIENT_ORIGIN` to the public HTTPS URL that users will visit.

3. Start the production stack:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   ```

4. Configure a TLS-terminating reverse proxy (such as Caddy, Nginx, or your platform load balancer) to forward the public HTTPS origin to `http://127.0.0.1:3001`. Do not expose PostgreSQL publicly.

5. Verify readiness:

   ```bash
   curl http://127.0.0.1:3001/healthz
   ```

The `postgres_data` and `uploads` Docker volumes must be included in backups. Before upgrading, back up both volumes and review database migrations. Run `npm run db:seed` only for local/demo data; it is intentionally excluded from production startup.

## Validation

```bash
npm run build
npm test
```

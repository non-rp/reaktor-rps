# API Run Modes

## Local

1. Copy `.env.example` to `.env` if needed.
2. Start Postgres only:

```bash
docker compose -f docker-compose.dev.yml up -d
```

3. Run the API on the host:

```bash
npm install
npx prisma generate
npm run dev
```

The local `.env` uses `localhost` in `DATABASE_URL` so Node/Express can connect to the database from your machine.
The dev compose file publishes Postgres on `localhost:5433` to avoid conflicts with any native Postgres already running on your machine.

## Production

Start the production containers:

```bash
docker compose up -d --build
```

The API is published only on `127.0.0.1:3000`, which is intended for reverse proxying from Nginx on the VPS.

Example Nginx upstream:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

# Otakudesu API Scraper

Unofficial API scraper for Otakudesu. Educational use only — use at your own risk.

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rizkyhaksono/otakudesu-be&type=Date)](https://star-history.com/#rizkyhaksono/otakudesu-be&Date)

## Environment

Copy `.env.example` to `.env` and set `BASEURL` to the Otakudesu site origin:

```bash
cp .env.example .env
```

```env
BASEURL=https://otakudesu.blog/
```

## Installation

```bash
npm install
```

## Running locally

```bash
npm run build
npm run start
```

Dev server:

```bash
npm run dev
```

Health check: `GET /api/health`

## Docker (recommended)

Builds a standalone Next.js image and runs `node server.js` (does **not** use the Node image `docker-entrypoint.sh`).

```bash
docker compose up --build -d
```

Service listens on host port `31421` → container `3000`. Set `BASEURL` via env or `.env`.

## Portainer

### Quick fix for `docker-entrypoint.sh: permission denied`

If you run `node:24-alpine` with a bind-mounted app directory, **override the entrypoint**:

```yaml
entrypoint: ["npm", "run", "start"]
```

See [`docker-compose.portainer.yml`](./docker-compose.portainer.yml) for a full stack example (`fe` + `be`).

On the host path you must still have installed deps and a production build:

```bash
cd /home/otakudesu-be-v2
git pull
npm ci
npm run build
```

### Preferred: deploy the built image

Build/push this repo’s `Dockerfile`, then use [`docker-compose.yml`](./docker-compose.yml) (no bind-mount, no Node entrypoint). Attach the stack to your external nginx network as needed.

## License

[MIT License](./LICENSE)

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

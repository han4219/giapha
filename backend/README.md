# Hoàng Đình Genealogy API (NestJS + Prisma)

## Setup

Postgres dev chạy trong Docker tại **127.0.0.1:15432** (tránh Postgres cài sẵn trên Mac chiếm 5432/5433).

```bash
cd backend
cp .env.example .env
docker compose up -d
yarn install
yarn prisma migrate deploy
yarn prisma generate
yarn prisma db seed
yarn start:dev
```

Swagger: http://localhost:8080/api/docs

Health: http://localhost:8080/api/health

## Scripts

- `yarn build` — compile
- `yarn test` — unit tests
- `yarn prisma:validate` — validate schema

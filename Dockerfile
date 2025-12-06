FROM            node:lts-alpine3.23

WORKDIR         /app

RUN             npm install -g pnpm

COPY            package.json package.json
COPY            pnpm-lock.yaml pnpm-lock.yaml

RUN             pnpm install --frozen-lockfile

COPY            . .

RUN             pnpm run build

USER            node

ENV             NODE_ENV=production

CMD             ["node", "/app/dist/index.js"]

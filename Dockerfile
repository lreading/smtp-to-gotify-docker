FROM            node:20-alpine3.19

WORKDIR         /app

RUN             npm install -g pnpm

COPY            package.json package.json
COPY            pnpm-lock.yaml pnpm-lock.yaml

RUN             --mount=type=secret,id=npmrc,target=/root/.npmrc pnpm install --frozen-lockfile

COPY            . .

RUN             pnpm run build

USER            node


CMD             ["node", "/app/dist/index.js"]

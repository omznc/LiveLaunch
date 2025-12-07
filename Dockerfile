FROM oven/bun:latest

WORKDIR /usr/src/app

COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile

COPY . .

CMD ["bun", "run", "start"]

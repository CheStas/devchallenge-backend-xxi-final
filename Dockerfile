FROM node:20 as builder

FROM builder as build
WORKDIR /app
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./
RUN npm install -g pnpm
RUN pnpm install
COPY . .
RUN pnpm run build

FROM build as development
ENV PORT=8080
ENV NODE_ENV=Production
EXPOSE ${PORT}
CMD ["pnpm", "run", "start:dev"]

FROM build as test
CMD ["pnpm", "run", "test"]

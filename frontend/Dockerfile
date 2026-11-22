FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV DOCKER_BUILD=true
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
WORKDIR /app

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]

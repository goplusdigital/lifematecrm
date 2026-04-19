# syntax=docker/dockerfile:1.7


FROM node:24-bookworm-slim AS deps
WORKDIR /app


COPY package.json package-lock.json ./
RUN npm install

FROM node:24-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_I18N_DEFAULT_LOCALE=th
ARG NEXT_PUBLIC_I18N_LOCALES=th,en
ARG NEXT_PUBLIC_API_BASE_URL="https://crm.lifematewellness.com"
ARG NEXT_PUBLIC_BASE_URL="https://crm.lifematewellness.com"

ENV NEXT_PUBLIC_I18N_DEFAULT_LOCALE=${NEXT_PUBLIC_I18N_DEFAULT_LOCALE}
ENV NEXT_PUBLIC_I18N_LOCALES=${NEXT_PUBLIC_I18N_LOCALES}
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_BASE_URL=${NEXT_PUBLIC_BASE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM node:24-bookworm-slim AS prod-deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --omit=dev

FROM node:24-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN groupadd --gid 1001 nodejs && useradd --uid 1001 --gid 1001 --create-home nextjs

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts

USER nextjs
EXPOSE 3001
CMD ["npm", "run", "start"]

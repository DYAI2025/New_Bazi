# syntax=docker/dockerfile:1

# ---- builder: install everything, build client bundle + server.cjs ----
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Supabase Anon-Key + URL werden zur Build-Zeit in das Browser-Bundle eingebettet.
# Service-Role-Key NIEMALS als ARG/ENV hier — er gehört nur in die Railway-Laufzeit-Vars.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
# ElevenLabs-Agent-IDs (Eve & Levi) — öffentliche Kennungen, kein Secret.
# Ohne diese ARGs erreichen die Railway-Vars den Vite-Build nie und das
# AgentWidget bleibt im (ehrlichen) Hidden-State.
ARG VITE_ELEVENLABS_AGENT_ID_LEVI
ARG VITE_ELEVENLABS_AGENT_ID_EVE
ENV VITE_ELEVENLABS_AGENT_ID_LEVI=$VITE_ELEVENLABS_AGENT_ID_LEVI
ENV VITE_ELEVENLABS_AGENT_ID_EVE=$VITE_ELEVENLABS_AGENT_ID_EVE
RUN npm run build

# ---- runner: production deps + built artifacts only ----
FROM node:22-slim AS runner
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=builder /app/dist ./dist

# Cloud Run injects PORT (default 8080); server.ts reads process.env.PORT and binds 0.0.0.0.
EXPOSE 8080
CMD ["node", "dist/server.cjs"]

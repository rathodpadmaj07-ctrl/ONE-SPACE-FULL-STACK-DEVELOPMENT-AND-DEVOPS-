# ---------- Frontend build ----------
FROM node:22-alpine AS frontend

WORKDIR /app/frontend

COPY OneSpace_Phase1/package*.json ./
RUN npm ci

COPY OneSpace_Phase1/ ./
RUN npm run build


# ---------- Backend ----------
FROM node:22-alpine

WORKDIR /app

COPY OneSpace_Phase1/server/package*.json ./
RUN npm ci --omit=dev

COPY OneSpace_Phase1/server/ ./

# Put the compiled React frontend where the Express app expects it.
COPY --from=frontend /app/frontend/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=5000

EXPOSE 5000

CMD ["node", "src/server.js"]

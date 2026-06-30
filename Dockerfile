# Pinned to the same Playwright version as package.json, so "works in
# Docker" actually means "works in CI" — no separate browser-install step
# needed, the image already has Chromium/Firefox/WebKit baked in.
FROM mcr.microsoft.com/playwright:v1.61.1-noble

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

CMD ["npm", "test"]

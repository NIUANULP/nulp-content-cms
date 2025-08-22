# ---- Base build image ----
FROM naskio/strapi:5.20.0-alpine AS builder

WORKDIR /srv/app

# Copy only package.json files first (cache layer)
COPY package*.json ./

# Install dependencies (all, including dev for build)
RUN npm install pg --save && \
    npm install

# Copy rest of the app
COPY ./ ./

# Build the Strapi app in DEV mode
ENV NODE_ENV=development
RUN npm run build


# ---- Final runtime image ----
FROM naskio/strapi:5.20.0-alpine

WORKDIR /srv/app

# Copy only package.json files first
COPY package*.json ./

# Install only production deps (if you really want dev mode, skip --production)
RUN npm install pg --save && \
    npm install

# Copy built app and source
COPY --from=builder /srv/app ./

# Explicitly set environment
ENV NODE_ENV=production

# Define dev script so CMD works
# (package.json should have "develop": "strapi start")
CMD ["npm", "start"]


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

# Build the Strapi app
RUN npm run build


# ---- Final runtime image ----
FROM naskio/strapi:5.20.0-alpine

WORKDIR /srv/app

# Copy only built app + production deps
COPY package*.json ./

# Install only production dependencies
RUN npm install pg --save && \
    npm install --production

# Copy build artifacts and source code from builder
COPY --from=builder /srv/app ./

ENV NODE_ENV=development

CMD ["npm", "start"]


FROM naskio/strapi:5.20.0-alpine

WORKDIR /srv/app

COPY ./my-strapi-app ./

# Install dependencies, including 'pg' for PostgreSQL
RUN npm install pg --save && \
    npm install && \
    npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]

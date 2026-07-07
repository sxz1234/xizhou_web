ARG NODE_IMAGE=public.ecr.aws/docker/library/node:20-bookworm-slim

FROM ${NODE_IMAGE}

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app

COPY index.html ./index.html
COPY css ./css
COPY js ./js
COPY assets ./assets
COPY static-server.js ./static-server.js

EXPOSE 8080

CMD ["node", "static-server.js"]

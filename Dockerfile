FROM node:16
MAINTAINER "thundersquared" <containers@thundersquared.com>

ENV CP_TARGET "http://127.0.0.1:2082"
ENV LISTEN_PORT 8021
ENV LISTEN_ADDRESS "127.0.0.1"

COPY app.js /app/app.js
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock

WORKDIR /app

RUN set -eux && \
        yarn

ENTRYPOINT yarn start

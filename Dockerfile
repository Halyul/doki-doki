FROM node:alpine

WORKDIR /dokidoki
ENV CONFIGPATH ./config.json

RUN apk add --no-cache git \
    && git clone https://github.com/Halyul/doki-doki.git /dokidoki \
    && mkdir /dokidoki/data \
    && npm install

CMD npm start --config-path ${CONFIGPATH}

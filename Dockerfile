FROM node:alpine

WORKDIR /dokidoki
ENV PORT 3000
ENV KEY 1234567890
ENV TIMES 20

RUN apk add --no-cache git \
    && git clone https://github.com/Halyul/doki-doki.git /dokidoki \
    && mkdir /dokidoki/data \
    && npm install

CMD [ "npm", "start", "--port ${PORT}", "--key ${KEY}", "--times ${TIMES}" ]

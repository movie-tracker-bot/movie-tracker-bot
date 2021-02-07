FROM node:alpine

RUN mkdir -p /usr/src/movie-tracker-bot

WORKDIR /usr/src/movie-tracker-bot

VOLUME /usr/src/movie-tracker-bot

CMD node .

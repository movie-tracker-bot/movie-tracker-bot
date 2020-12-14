from node:alpine

run mkdir -p /usr/src/movie-tracker-bot

workdir /usr/src/movie-tracker-bot

volume /usr/src/movie-tracker-bot

cmd node .

FROM node:15.7.0-alpine
	# 15.6-alpine
	# lts-alpine

RUN mkdir -p /usr/src/movie-tracker-bot

WORKDIR /usr/src/movie-tracker-bot

VOLUME /usr/src/movie-tracker-bot

CMD node .

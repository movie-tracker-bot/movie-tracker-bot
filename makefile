.PHONY: image run

image:
	docker build . -t movie-tracker-bot:latest

run:
	docker run --rm -ti -v ${PWD}/:/usr/src/movie-tracker-bot/ -e BOT_TOKEN=$(BOT_TOKEN) movie-tracker-bot:latest

test:
	docker run --rm -ti -v ${PWD}/:/usr/src/movie-tracker-bot/ -e BOT_TOKEN=$(BOT_TOKEN) movie-tracker-bot:latest npm run test

shell:
	docker run --rm -ti -v ${PWD}/:/usr/src/movie-tracker-bot/ -e BOT_TOKEN=$(BOT_TOKEN) movie-tracker-bot:latest sh

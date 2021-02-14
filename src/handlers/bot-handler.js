const ImdbService = require('../services/imdb-service')
const Movie = require('../models/movie')
const User = require('../models/user')
const UserMovie = require('../models/user-movie')
const Menssages = require('../helpers/messages')
const Formatter = require('../helpers/formatter')


class BotHandler {
    /**
     * Initializes the BotHandler, registering endpoints to the given telegraf instance.
     * To launch the bot, call `launch`.
     * To stop the bot, call `stop`.
     * @param {Telegraf} telegraf the telegraf instance
    */
    constructor(telegraf) {
        this.telegraf = telegraf

        this.state = {}

        this.telegraf.start(BotHandler.start)

        this.handlers = {
            add: {
                pattern: / *?\add (.*)$/i,
                handler: this.addMovie,
            },
            rand: {
                pattern: / *?rand$/i,
                handler: this.randMovie,
            },
            score: {
                pattern: / *?score (.*)$/i,
                handler: this.setScore,
            },
            remove: {
                pattern: / *?remove (.*)$/i,
                handler: this.removeMovie,
            }
        }

        for (let endpoint of Object.values(this.handlers)) {
            this.telegraf.hears(
                endpoint.pattern,
                endpoint.handler.bind(this)
            )
            console.log(`Registering handler for ${endpoint.pattern}`)
        }

        this.telegraf.on(
            'text',
            this.text.bind(this)
        )
    }


    static async start(ctx) {
        const welcomeMessage = Menssages.welcomeMessage()
        await ctx.replyWithMarkdown(welcomeMessage)
        let user = new User(ctx.from.id, ctx.from.username)
        user.createIfDoesntExist()
    }


    async text(ctx) {
        console.log(`text handler: ${ctx.message.text}`)

        const user = ctx.from.id

        if (this.state[user]) {
            console.log('Dispatching to state handler...')
            await this.state[user].next(ctx)
        }
        else {
            console.log('No state for current user.')
            await ctx.reply('Sorry, I don\'t understand.')
        }
    }


    async addMovie(ctx, next) {
        const user = ctx.from.id

        if (this.state[user]) { // Previous action is still ongoing.
            await next()
            return
        }

        const query = ctx.match[1]

        console.log(`Add command: ${query}`)

        const state = this.state[user] = {
            movie_ix: 0,
            movie_list: await ImdbService.getMovieByTitle(query),
        }

        BotHandler.askMovieConfirmation(ctx, state)

        state.next = this.confirm.bind(
            this,

            async (ctx, state) => {
                const movie = state.movie_list[state.movie_ix]

                const movieDAO = new Movie(null, movie.id, movie.title, movie.year, movie.image.url)
                movieDAO.createIfDoesntExist()

                const userMovieDAO = new UserMovie(null, ctx.from.id, movie.id)
                userMovieDAO.createIfDoesntExist()

                await ctx.reply('Got it!')

                return true
            },

            async (ctx, state) => {
                state.movie_ix++

                if (state.movie_list.length == state.movie_ix) {
                    await ctx.reply('Well, I ain\'t got any other suggestions...')
                    return true
                }
                else {
                    BotHandler.askMovieConfirmation(ctx, state)
                    return false
                }
            },

            async (ctx, state) => {
                await ctx.reply('Cancelling...')
                return true
            }
        )
    }


    static async askMovieConfirmation(ctx, state) {
        const movie = state.movie_list[state.movie_ix]

        await ctx.reply(movie.title)

        if (movie.image) {
            await ctx.replyWithPhoto(movie.image.url)
        }

        await ctx.reply('Is this the correct movie?')
    }


    async confirm(positive, negative, cancel, ctx) {
        const user = ctx.from.id

        const message = ctx.message.text

        console.log(`Got confirmation message: ${message}`)

        const positive_answer = /^(yes+|yep|yeah|y)$/i
        const negative_answer = /^(no+|nope|nah|n)$/i
        const cancel_answer = /^(cancel|nvm|forget it)$/i

        const state = this.state[user]

        let done = false

        switch (true) {
            case positive_answer.test(message):
                done = await positive(ctx, state)
                break

            case negative_answer.test(message):
                done = await negative(ctx, state)
                break

            case cancel_answer.test(message):
                done = await cancel(ctx, state)
                break

            default:
                await ctx.reply('Come again?')
                break
        }

        if (done) {
            delete this.state[user]
        }
    }


    async randMovie(ctx, next) {
        const user = ctx.from.id

        if (this.state[user]) { // Previous action is still ongoing.
            await next()
            return
        }

        console.log('Rand command')

        const userMovie = await UserMovie.findRandomByUserTelegramId(user)

        const movie = userMovie.movie_id

        if (movie) {
            await ctx.reply(movie.title)

            if (movie.poster_url) {
                await ctx.replyWithPhoto(movie.poster_url)
            }

            await ctx.reply('Have a nice movie :)')
        }
        else {
            await ctx.reply('You don\'t have any movies in you list :(')
            await ctx.reply('Try adding some with the \'add\' command.')
        }
    }

    async setScore(ctx, next) {
        const id = ctx.from.id

        if (this.state[id]) { // Previous action is still ongoing.
            await next()
            return
        }

        const movieName = Formatter.removeAccentsAndLowerCase(ctx.match[1])
        const score = Formatter.getNumberOfString(ctx.match[1])
        if (!movieName || !score) {
            await ctx.reply('To add score please send movie name + score')
            return
        } else if (score < 0 || score > 10) {
            await ctx.reply('The score need to be between 0 and 10')
            return
        }

        const state = this.state[id] = {
            movie_ix: 0,
            movie_list: await ImdbService.getMovieByTitle(movieName),
        }

        BotHandler.askMovieConfirmation(ctx, state)

        console.log(`Add Score: ${score} to ${movieName} for user ${id}`)
        state.next = this.confirm.bind(
            this,
            async () => {
                const movie = state.movie_list[state.movie_ix]

                const movieDAO = new Movie(null, movie.id, movie.title, movie.year, movie.image.url)
                movieDAO.createIfDoesntExist()

                const userMovieDAO = new UserMovie(null, ctx.from.id, movie.id, true, score)
                userMovieDAO.createIfDoesntExist()

                await ctx.reply(`Save score ${score} for ${movie.title}`)

                return true
            },
            async () => {
                state.movie_ix++

                if (state.movie_list.length == state.movie_ix) {
                    await ctx.reply('Well, I ain\'t got any other suggestions...')
                    return true
                }
                else {
                    BotHandler.askMovieConfirmation(ctx, state)
                    return false
                }
            },
            async () => {
                await ctx.reply('Cancelling...')
                return true
            }
        )
    }

    async removeMovie(ctx, next) {
        const user = ctx.from.id

        if (this.state[user]) { // Previous action is still ongoing.
            await next()
            return
        }

        const movieName = ctx.match[1]
        if (!movieName || movieName.length <= 0) {
            await ctx.reply('To remove a movie, you must inform the name')
            return
        }

        const movie = await Movie.findByTitle(movieName)
        if (!movie) {
            await ctx.reply(`Thie movie ${movieName} isn't in your list`)
            return
        }

        //TODO: Delete movie 
        await ctx.reply(`Thie movie ${movieName} was deleted!`)
        return

    }

    async launch() {
        await this.telegraf.launch()
    }


    async stop() {
        await this.telegraf.stop()
    }
}

module.exports = BotHandler

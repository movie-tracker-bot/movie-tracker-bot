const Movie = require('../models/movie')
const User = require('../models/user')
const UserMovie = require('../models/user-movie')
const Genre = require('../models/genre')
const MovieGenreList = require('../models/movie-genre-list')

const Menssages = require('../helpers/messages')
const Formatter = require('../helpers/formatter')

const ImdbService = require('../services/imdb-service')
const MovieListService = require('../services/movie-list-service')


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
                pattern: /^ *add +(.*)$/i,
                handler: this.addMovie,
            },
            rand: {
                pattern: /^ *rand$/i,
                handler: this.randMovie,
            },
            score: {
                pattern: /^ *score +(.*)$/i,
                handler: this.setScore,
            },
            remove: {
                pattern: /^ *remove +(.*)$/i,
                handler: this.removeMovie,
            },
            watched: {
                pattern: /^ *watched +(.*)$/i,
                handler: this.setWatched,
            },
            list: {
                pattern: /^ *list +(.*?) *$/i,
                handler: this.getMovies,
            },
            myRank: {
                pattern: /^ *myRank$/i,
                handler: this.getRank,
            },
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

                var poster_url = null
                if (movie.image){
                    poster_url = movie.image.url
                }

                const movieDAO = new Movie(null, movie.id, movie.title, movie.year, poster_url)
                await movieDAO.createIfDoesntExist()

                const userMovieDAO = new UserMovie(null, ctx.from.id, movieDAO.id)
                userMovieDAO.createIfDoesntExist()

                const movieGenreList = new MovieGenreList(movieDAO.id)
                const genres = await ImdbService.getMovieGenres(Formatter.getMovieId(movie.id))

                for (const genre of genres) {
                    await movieGenreList.add(new Genre(null, genre))
                }

                await ctx.reply(`Got it! ${movie.title} added to your list!`)

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

    static async askMovieFromDatabaseConfirmation(ctx, movie, question = 'Is this the correct movie?'){
        await ctx.reply(movie.title)
        if (movie.poster_url){
            await ctx.replyWithPhoto(movie.poster_url)
        }
        await ctx.reply(question)
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

        const userMovie = await UserMovie.findUnwatchedRandomByTelegramId(user)

        if (userMovie) {
            const movie = userMovie.movie_id

            await ctx.reply(movie.title)

            if (movie.poster_url) {
                await ctx.replyWithPhoto(movie.poster_url)
            }

            await ctx.reply('Have a nice movie :)')
        }
        else {
            await ctx.reply('You don\'t have any unwatched movies in you list :(')
            await ctx.reply('Try adding some with the \'add\' command.')
        }
    }

    async setScore(ctx, next) {
        const id = ctx.from.id

        if (this.state[id]) { // Previous action is still ongoing.
            await next()
            return
        }
        var movieName =  Formatter.removeScore(ctx.match[1])
        movieName = Formatter.toTitleCase(movieName)
        const score = Formatter.getNumberOfString(ctx.match[1])

        if (!movieName || !score) {
            await ctx.reply('To add score please send movie name + score')
            return
        } else if (score < 0 || score > 10) {
            await ctx.reply('The score need to be between 0 and 10')
            return
        }

        const movie = await Movie.findByTitle(movieName)
        if (!movie) {
            const movieName = Formatter.removeAccentsAndLowerCase(ctx.match[1])
            let movie_list = await ImdbService.getMovieByTitle(movieName)
            var poster_url = null
            if (movie_list[0].image){
                poster_url = movie_list[0].image.url
            }
            const movie = new Movie(null,movie_list[0].id,movie_list[0].title,movie_list[0].year,poster_url)
            await movie.createIfDoesntExist()
            await BotHandler.askMovieFromDatabaseConfirmation(ctx, movie,`The movie isn't on your list\nDo you want to add it and set it's score to ${score}?`)
            var state = this.state[id] = {userId: id,
                             movieName: movieName,
                             score: score}
            this.state[id].next = this.confirm.bind(
                this,
                async (ctx, state)=>{
                    const userMovieDAO = new UserMovie(null, id, movie.id, true, score)
                    userMovieDAO.createIfDoesntExist()
                    await ctx.reply(`Saved score ${score} for ${movie.title}`)
                    return true
                },
                async (ctx) =>{
                    await ctx.reply(`Ok! This score won\'t be set to ${movie.title}, because it ain\'t on your list\nIf you want to score a movie other than the one suggested add it to your list first, using the /add command`)
                    return true
                },
                async (ctx) =>{
                    await ctx.reply(`Cancelling...\n
                    If you want to score a movie other than the one suggested, add it to your list first, using the /add command`)
                    return true
                })
            return
        }

        const userMovie = await UserMovie.findByUserTelegramIdAndMovieId(id,movie.id)
        if (!userMovie){
            await BotHandler.askMovieFromDatabaseConfirmation(ctx, movie, `This movie isn\'t on your list\nDo you want to add it and set it\'s score to ${score}?`)
            this.state[id] = {}
            this.state[id].next = this.confirm.bind(
                this,
                async (ctx) => {
                    const userMovieDAO = new UserMovie(null, id, movie.id, true, score)
                    userMovieDAO.createIfDoesntExist()
                    await ctx.reply(`Saved score ${score} for ${movie.title}`)
                    return true
                },
                async (ctx) =>{
                    await ctx.reply(`Ok! This score won\'t be set to ${movieName}, because it ain\'t on your list`)
                    return true
                },
                async (ctx) =>{
                    await ctx.reply(`Cancelling...`)
                    return true
                }
            )
            return
        }

        await BotHandler.askMovieFromDatabaseConfirmation(ctx, movie, `Do you want to set ${movieName}\'s score to ${score}?`)
        this.state[id] = {}
        this.state[id].next = this.confirm.bind(
            this,
            async () => {
                const userMovieDAO = new UserMovie(null, id, movie.id, true, score)
                userMovieDAO.createIfDoesntExist()
                await ctx.reply(`Saved score ${score} for ${movie.title}`)
                return true
            },
            async () =>{
                await ctx.reply(`Ok! This score won\'t be set to ${movieName}`)
                return true
            },
            async () =>{
                await ctx.reply(`Cancelling...`)
                return true
            }
        )
        return
    }

    async scoreADatabaseMovie(ctx, state){
        const movieName = state.movie.title
        const movie = state.movie
        const score = state.score
        const user = state.userId

        await BotHandler.askMovieFromDatabaseConfirmation(ctx, movie, `Is this the movie you want to set the score to ${score}?`)
        this.state[user].next = this.confirm.bind(
            this,
            async() => {
                const userMovieDAO = new UserMovie(null, user, movie.id, true, score)
                userMovieDAO.createIfDoesntExist()

                await ctx.reply(`Save score ${score} for ${movie.title}`)
            },
            async () => {
                await ctx.reply(`Ok! ${movie.title} score wasn`)
            }
        )
    }

    async removeMovie(ctx, next) {
        const user = ctx.from.id

        if (this.state[user]) { // Previous action is still ongoing.
            await next()
            return
        }

        const movieName = Formatter.toTitleCase(ctx.match[1])
        if (!movieName || movieName.length <= 0) {
            await ctx.reply('To remove a movie, you must inform the name')
            return
        }
        const movie = await Movie.findByTitle(movieName)
        if (!movie) {
            await ctx.reply(`The movie ${movieName} isn't on your list`)
            return
        }
        const userMovie = await UserMovie.findByUserTelegramIdAndMovieId(user,movie.id)
        if (!userMovie){
            await ctx.reply(`The movie ${movieName} isn't on your list`)
            return
        }
        await BotHandler.askMovieFromDatabaseConfirmation(ctx,movie, "Are you sure you want to remove this movie from your list? This action can't be undone")

        this.state[user] = {}
        this.state[user].next = this.confirm.bind(
            this,
            async (ctx) => {
                await userMovie.delete()
                await ctx.reply(`The movie ${movieName} was removed from your list!`)
                return true
            },
            async (ctx) =>{
                await ctx.reply(`Ok! ${movieName} will remain on your list`)
                return true
            },
            async (ctx) =>{
                await ctx.reply('Cancelling...')
                return true
            }
        )
    }


    async getMovies(ctx, next) {
        const id = ctx.from.id

        if (this.state[id]) { // Previous action is still ongoing.
            await next()
            return
        }

        console.log('List command')

        const options = ctx.match[1].split(' ')

        if (options.length > 2) {
            await ctx.reply('Sorry, I don\'t understand.')
            return
        }

        // We may only use toLowerCase here because all commands contain only ASCII characters.
        const type = options[0].toLowerCase()
        const genre = options[1]

        const user = new User(ctx.from.id, ctx.from.username)
        const movieListService = new MovieListService(user)

        let getters = {
            all:       () => movieListService.getList(),
            watched:   () => movieListService.getList(true),
            unwatched: () => movieListService.getList(false)
        }

        if (!getters.hasOwnProperty(type)) { // Invalid type.
            await ctx.reply('Sorry, I don\'t understand.')
            return
        }

        let movies = await getters[type]();

        if (genre) {
            movies = movies.filter(
                movie => movie.genreList.contains(genre)
            )
        }

        if (movies.length == 0) {
            await ctx.reply(
                'There are no movies matching this criteria! You can add new movies using the /add comand'
            )
            return
        }

        let response = ''
        const watched_emojis = [ '🎞', '✔' ]

        for (let movie of movies) {
            const watched = movie.watched ? 1 : 0
            response += `${watched_emojis[watched]} ${movie.title}\n`
        }

        await ctx.reply(response)
    }


    async getRank(ctx, next) {
        const id = ctx.from.id

        if (this.state[id]) { // Previous action is still ongoing.
            await next()
            return
        }

        let movies = await UserMovie.findMovieListByUserTelegramId(id)
        movies = MovieListService.sortByScore(movies)

        if (!movies || movies.length <= 0) {
            await ctx.reply('Your list is empty, you can add new movies using /add comand')
            return
        }

        await ctx.reply(Menssages.rankMovieMessage(movies))
        return
    }

    async setWatched(ctx, next){
        const userId = ctx.from.id

        if (this.state[userId]){ // Previous action is still ongoing.
            await next()
            return
        }

        const movieName = Formatter.toTitleCase(ctx.match[1])
        if (!movieName || movieName.length <= 0) {
            await ctx.reply('To set a movie as watched, you must inform it\'s name')
            return
        }
        const movie = await Movie.findByTitle(movieName)
        if (!movie) {
            await ctx.reply(`The movie ${movieName} isn't on your list`)
            return
        }
        const userMovie = await UserMovie.findByUserTelegramIdAndMovieId(userId,movie.id)
        if (!userMovie){
            await ctx.reply(`The movie ${movieName} isn't on your list`)
            return
        }

        await BotHandler.askMovieFromDatabaseConfirmation(ctx,movie, 'Do you want to set this movie as watched?')
        this.state[userId] = {}
        this.state[userId].next = this.confirm.bind(
            this,
            async (ctx) => {
                userMovie.watched = true
                await userMovie.updateWatched()
                await ctx.reply(`The movie ${movieName} is now set as watched!`)
                return true
            },
            async (ctx) =>{
                await ctx.reply(`Ok! ${movieName} will remain unwatched`)
                return true
            },
            async (ctx) =>{
                await ctx.reply('Cancelling...')
                return true
            }
        )

    }
    async launch() {
        await this.telegraf.launch()
    }


    async stop() {
        await this.telegraf.stop()
    }
}

module.exports = BotHandler

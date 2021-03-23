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
                pattern: /^ *[/]?add +(.*)$/i,
                handler: this.addMovie,
            },
            adicionar: {
                pattern: / *?adicionar (.*)$/i,
                handler: this.addMovie,
            },
            rand: {
                pattern: /^ *[/]?rand( +(.*?))? *$/i,
                handler: this.randMovie,
            },
            random: {
                pattern: / *?random$/i,
                handler: this.randMovie,
            },
            score: {
                pattern: /^ *[/]?score +(.*)$/i,
                handler: this.setScore,
            },
            remove: {
                pattern: /^ *[/]?remove +(.*)$/i,
                handler: this.removeMovie,
            },
            rm: {
                pattern: / *?rm (.*)$/i,
                handler: this.removeMovie,
            },
            watched: {
                pattern: /^ *[/]?watched +(.*)$/i,
                handler: this.setWatched,
            },
            list: {
                pattern: /^ *[/]?list +(.*?) *$/i,
                handler: this.getMovies,
            },
            myRank: {
                pattern: /^ *[/]?myRank$/i,
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
        if (this.state[user] && this.state[user].next) {
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

        if (await this.endPreviousAction(user, next)) {
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
                if (movie.image) {
                    poster_url = movie.image.url
                }

                const movieDAO = new Movie(null, movie.id, movie.title.toLowerCase(), movie.year, poster_url)
                await movieDAO.createIfDoesntExist()

                const userMovieDAO = new UserMovie(null, ctx.from.id, movieDAO.id)
                userMovieDAO.createIfDoesntExist()

                const movieGenreList = new MovieGenreList(movieDAO.id)
                const genres = await ImdbService.getMovieGenres(Formatter.getMovieId(movie.id))

                for (const genre of genres) {
                    await movieGenreList.add(new Genre(null, genre))
                }

                await ctx.reply(`Got it! ${Formatter.toTitleCase(movie.title)} added to your list!`)

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

        await ctx.reply(Formatter.toTitleCase(movie.title))

        if (movie.image) {
            await ctx.replyWithPhoto(movie.image.url)
        }
        else if(movie.poster_url){
            await ctx.replyWithPhoto(movie.poster_url)
        }
        await ctx.reply('Is this the correct movie?')
    }

    static async askMovieFromDatabaseConfirmation(ctx, movie, question = 'Is this the correct movie?') {
        if (!movie) {
            return
        }
        await ctx.reply(Formatter.toTitleCase(movie.title))
        if (movie.poster_url) {
            await ctx.replyWithPhoto(movie.poster_url)
        }
        await ctx.reply(question)
    }

    async confirm(positive, negative, cancel, ctx) {
        const user = ctx.from.id

        const message = ctx.message.text

        console.log(`Got confirmation message: ${message}`)

        const positive_answer = /^(yes+|yep|yeah|y|sim|s)$/i
        const negative_answer = /^(no+|nope|nah|n|não)$/i
        const cancel_answer = /^(cancel|nvm|forget it|cancelar)$/i

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

        if (await this.endPreviousAction(user, next)) {
            return
        }

        console.log('Rand command')

        const genre = ctx.match[2]

        const userMovie = await (
            genre
                ? UserMovie.findUnwatchedRandomByTelegramIdAndGenre(user, genre)
                : UserMovie.findUnwatchedRandomByTelegramId(user)
        )

        if (userMovie) {
            const movie = userMovie.movie_id

            if (!movie) {
                await ctx.reply('Sorry I didn\'t found a movie for you :()')
                return
            }

            await ctx.reply(Formatter.toTitleCase(movie.title))

            if (movie.poster_url) {
                await ctx.replyWithPhoto(movie.poster_url)
            }

            await ctx.reply('Have a nice movie :)')
        } else {
            await ctx.reply('You don\'t have any unwatched movies in you list :(')
            await ctx.reply('Try adding some with the \'add\' command.')
        }
    }

    async getMovie(ctx, next){
        try{
            var userId = ctx.from.id
            const user = await User.findByTelegramId(userId)
            const movieListService = new MovieListService(user)
            
            if (!this.state[userId].movieYear){
                var movieList = await movieListService.findMoviesByTitle(this.state[userId].movieName)
                if (movieList.length > 1){
                    this.state[userId].movie_ix = 0
                    this.state[userId].movie_list = movieList
                    const state = this.state[userId]
                    await BotHandler.askMovieConfirmation(ctx, state)
                    state.next = this.confirm.bind(
                        this,
            
                        async (ctx, state) => {
                            var movie = state.movie_list[state.movie_ix]
                            
                            state.movie = movie
                            next(ctx, state)
                            return true
                        },
            
                        async (ctx, state) => {
                            state.movie_ix++
            
                            if (state.movie_list.length == state.movie_ix) {
                                await ctx.reply('Well, I ain\'t got any other suggestions...')
                                return true
                            }
                            else {
                                await BotHandler.askMovieConfirmation(ctx, state)
                                return false
                            }
                        },
            
                        async (ctx, state) => {
                            await ctx.reply('Cancelling...')
                            return true
                        }
                    )
                    return
                }
                
            }
            else{
                var movieList = await movieListService.findMoviesByTitleAndYear(this.state[userId].movieName, this.state[userId].movieYear)
            }
            if (!movieList.length) {
                await ctx.reply('This movie isn\'t on your list, try adding it with the /add command')
                delete this.state[userId]
                return
            }
            else{
                var state = this.state[userId]
                state.movie = movieList[0]
                next(ctx, state)
                return
            }
        }catch(err){
            console.log('An error occurred while geting movie from user')
            throw err
        }
    }

    async setScore(ctx, next) {
        const id = ctx.from.id

        if (await this.endPreviousAction(id, next)) {
            return
        }

        var movieName = Formatter.removeScore(ctx.match[1])
        const score = Formatter.getNumberOfString(ctx.match[1])
        const movieYear = Formatter.getYear(ctx.match[1])
        if(movieYear){
            movieName = Formatter.removeYear(movieName)
        }

        if (!movieName || !score) {
            await ctx.reply('To add score please send movie name + score')
            return
        } else if (score < 0 || score > 10) {
            await ctx.reply('The score need to be between 0 and 10')
            return
        }
        this.state[id] = {
            movieName: movieName,
            movieYear: movieYear,
            score: score
        }
        this.getMovie(ctx, this.setScoreForMovie.bind(this))   
    }

    async setScoreForMovie(ctx, state){
        const id = ctx.from.id
        const movie = state.movie
        const score = state.score
        await BotHandler.askMovieFromDatabaseConfirmation(ctx, movie, `Do you want to set this movie\'s score to ${score}?`)
        this.state[id] = {}
        this.state[id].next = this.confirm.bind(
            this,
            async (ctx) => {
                const userMovieDAO = new UserMovie(null, id, movie.id, true, score)
                userMovieDAO.createIfDoesntExist()
                await ctx.reply(`Saved score ${score} for ${Formatter.toTitleCase(movie.title)}`)
                return true
            },
            async (ctx) => {
                await ctx.reply(`Ok! This score won't be set to ${Formatter.toTitleCase(movie.title)}`)
                return true
            },
            async (ctx) => {
                await ctx.reply('Cancelling...')
                return true
            }
        )
        return
    }

    async removeMovie(ctx, next) {
        const id = ctx.from.id

        if (await this.endPreviousAction(id, next)){
            return
        }

        if (!ctx.match[1] || ctx.match[1].length <= 1) {
            await ctx.reply('To remove a movie, you must inform the name')
            return
        }
        var movieName = ctx.match[1]
        const movieYear = Formatter.getYear(ctx.match[1])
        if(movieYear){
            movieName = Formatter.removeYear(movieName)
        }

        this.state[id] = {
            movieName: movieName,
            movieYear: movieYear,
        }
        this.getMovie(ctx, this.removeFoundMovie.bind(this))
       
    }

    async removeFoundMovie(ctx, state){
        const user = ctx.from.id
        const movie = state.movie
        const userMovie = await UserMovie.findByUserTelegramIdAndMovieId(user,movie.id)
        await BotHandler.askMovieFromDatabaseConfirmation(ctx, movie, 'Are you sure you want to remove this movie from your list? This action can\'t be undone')

        this.state[user] = {}
        this.state[user].next = this.confirm.bind(
            this,
            async (ctx) => {
                await userMovie.delete()
                await ctx.reply(`The movie ${Formatter.toTitleCase(movie.title)} was removed from your list!`)
                return true
            },
            async (ctx) => {
                await ctx.reply(`Ok! ${Formatter.toTitleCase(movie.title)} will remain on your list`)
                return true
            },
            async (ctx) => {
                await ctx.reply('Cancelling...')
                return true
            }
        )
    }

    async getMovies(ctx, next) {
        const id = ctx.from.id

        if (await this.endPreviousAction(id, next)) {
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
            all: () => movieListService.getList(),
            watched: () => movieListService.getList(true),
            unwatched: () => movieListService.getList(false),
            scored: () => movieListService.getList(null, true)
        }

        if (!Object.prototype.hasOwnProperty.call(getters, type)) { // Invalid type.
            await ctx.reply('Sorry, I don\'t understand.')
            return
        }

        let movies = await getters[type]()

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
        const watched_emojis = ['🎞', '✔']
        if (type == 'scored') {
            for (let movie of movies) {
                const watched = movie.watched ? 1 : 0
                response += `${watched_emojis[watched]} ${Formatter.toTitleCase(movie.title)} - Your score: ${movie.score}\n`
            }
        }
        else {
            for (let movie of movies) {
                const watched = movie.watched ? 1 : 0
                response += `${watched_emojis[watched]} ${Formatter.toTitleCase(movie.title)}\n`
            }
        }


        await ctx.reply(response)
    }


    async getRank(ctx, next) {
        const id = ctx.from.id

        if (await this.endPreviousAction(id, next)) {
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

    async setWatched(ctx, next) {
        const userId = ctx.from.id
        if (await this.endPreviousAction(userId, next)) {
            return
        }

        if (!ctx.match[1] || ctx.match[1].length <= 0) {
            await ctx.reply('To set a movie as watched, you must inform it\'s name')
            return
        }
        var movieName = ctx.match[1].toLowerCase()
        const movieYear = Formatter.getYear(ctx.match[1])
        if(movieYear){
            movieName = Formatter.removeYear(movieName)
        }

        this.state[userId] = {
            movieName: movieName,
            movieYear: movieYear,
        }
        this.getMovie(ctx, this.setFoundMovieAsWatched.bind(this))

    }

    async setFoundMovieAsWatched(ctx, state){
        const userId = ctx.from.id
        const movie = state.movie
        const userMovie = await UserMovie.findByUserTelegramIdAndMovieId(userId,movie.id)

        await BotHandler.askMovieFromDatabaseConfirmation(ctx, movie, 'Do you want to set this movie as watched?')
        this.state[userId] = {}
        this.state[userId].next = this.confirm.bind(
            this,
            async (ctx) => {
                userMovie.watched = true
                await userMovie.updateWatched()
                await ctx.reply(`The movie ${Formatter.toTitleCase(movie.title)} is now set as watched!`)
                return true
            },
            async (ctx) => {
                await ctx.reply(`Ok! ${Formatter.toTitleCase(movie.title)} will remain unwatched`)
                return true
            },
            async (ctx) => {
                await ctx.reply('Cancelling...')
                return true
            }
        )
    }

    async endPreviousAction(userId, next){
        if (this.state[userId]) { // Previous action is still ongoing.
            await next()
            return true
        }
        else{
            return false
        }
    }

    async launch() {
        await this.telegraf.launch()
    }


    async stop() {
        await this.telegraf.stop()
    }
}

module.exports = BotHandler

const Utils = require('../../helpers/utils')
const User = require('./user')
const Movie = require('./movie')

class UserMovie {
    static saved = [];

    /**
     * @param {number} id - assigned by database 
     * @param {User} user - user already on database
     * @param {Movie} movie - movie already on database
     * @param {boolean} watched - if user has watched the movie. Default false 
     * @param {number} score - score given by user 
     */
    constructor(id = null, user = null, movie = null, watched = false, score = null) {
        this.id = id
        this.user_id = user
        this.movie_id = movie
        this.watched = watched
        this.score = score
    }

    static reset() {
        UserMovie.saved.length = 0
    }

    async createIfDoesntExist() {
        this.save()
    }

    async save() {
        UserMovie.saved.push(this)
    }

    static async findByUserTelegramIdAndMovieId(user_telegram_id, movie_id) {
        // TODO.
    }

    static async findUnwatchedRandomByTelegramId(user_telegram_id) {
        return UserMovie.saved[0]
    }

    static async findUnwatchedRandomByTelegramIdAndGenre(user_telegram_id, genre_name) {
        return UserMovie.saved.find(
            user_movie => {
                return user_movie.movie_id.genreList.genres.some(
                    genre => Utils.StringEqualsIgnoreCase(genre.name, genre_name)
                )
            }
        )
    }
    /**
    /**
     * 
     * @param {Number} user_telegram_id 
     */
    static async findMovieListByUserTelegramId(user_telegram_id) {
        return UserMovie.saved
            .filter(
                user_movie => user_movie.user_id.telegram_id == user_telegram_id
            )
            .map(
                user_movie => {
                    let movie = user_movie.movie_id
                    movie.watched = user_movie.watched
                    return movie
                }
            )
    }

    /**
     * 
     * @param {Number} user_telegram_id 
     * @param {Boolean} watched 
     */
    static async findMovieListByUserTelegramIdAndWatched(user_telegram_id, watched) {
        return UserMovie.saved
            .filter(
                user_movie => user_movie.watched == watched
                           && user_movie.user_id.telegram_id == user_telegram_id
            )
            .map(
                user_movie => {
                    let movie = user_movie.movie_id
                    movie.watched = user_movie.watched
                    return movie
                }
            )
    }

}

module.exports = UserMovie

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
    /**
    /**
     * 
     * @param {Number} user_telegram_id 
     */
    static async findMovieListByUserTelegramId(user_telegram_id) {
        // TODO.
    }

    /**
     * 
     * @param {Number} user_telegram_id 
     * @param {Boolean} watched 
     */
    static async findMovieListByUserTelegramIdAndWatched(user_telegram_id, watched) {
        // TODO.
    }

}

module.exports = UserMovie

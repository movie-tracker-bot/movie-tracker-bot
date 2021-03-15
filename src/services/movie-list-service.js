const UserMovie = require('../models/user-movie')

class MovieListService {
    /**
     *
     * @param {User} user
     */
    constructor(user = null) {
        this.user = user
    }
    /**
     *
     * @param {number} maxLength - lenght of list. If null, will get full list
     * @param {boolean} watched - if list is of watched or unwatched movies, if null will get both
     */
    async getList(watched = null) {
        if (watched === null) {
            return await UserMovie.findMovieListByUserTelegramId(this.user.telegram_id)
        }
        else {
            return await UserMovie.findMovieListByUserTelegramIdAndWatched(this.user.telegram_id, watched)
        }
    }

    /**
     * @param {Number} maxLength - lenght of list. If null, will get full list
     */
    async getListByScore(maxLength = 10) {

    }

    static sortByScore(movies) {
        let ranks = []
        for (const movie of movies) {
            if (movie.score && !Number.isNaN(movie.score)) {
                ranks.push(movie)
            }
        }
        return ranks.sort((a, b) => Number(a.score) > Number(b.score))
    }
}

module.exports = MovieListService

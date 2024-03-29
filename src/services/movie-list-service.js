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
     * @param {boolean} watched - if list is of watched or unwatched movies, if null will get both
     * @param {boolean} watched - if list is of scored movies, if null will get all. If true, will get only
     *                              scored.
     */
    async getList(watched = null, scored = null) {
        if (watched === null && scored === null) {
            return await UserMovie.findMovieListByUserTelegramId(this.user.telegram_id)
        } else if (watched != null) {
            return await UserMovie.findMovieListByUserTelegramIdAndWatched(this.user.telegram_id, watched)
        } else {
            const movie_list = await UserMovie.findMovieListByUserTelegramIdAndScoreNotNull(this.user.telegram_id)
            return MovieListService.sortByScore(movie_list)
        }
    }

    async findMoviesByTitle(title) {
        var titleToSearch = title.toLowerCase()
        var movieList = await UserMovie.findMovieListByUserTelegramId(this.user.telegram_id)
        return movieList.filter(movie => movie.title === titleToSearch)
    }

    async findMoviesByTitleAndYear(title, year) {
        var titleToSearch = title.toLowerCase()
        var movieList = await UserMovie.findMovieListByUserTelegramId(this.user.telegram_id)
        return movieList.filter(movie => movie.title === titleToSearch && movie.year == year)
    }

    static sortByScore(movies) {
        let ranks = []
        for (const movie of movies) {
            if (movie.score && !Number.isNaN(movie.score)) {
                ranks.push(movie)
            }
        }
        return ranks.sort((a, b) => Number(b.score) - Number(a.score))
    }
}

module.exports = MovieListService

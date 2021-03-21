const movies = require('./movies.json')


class ImdbService {
    static async getMovieByTitle(title) {
        return movies
    }

    static async getMovieDetails(id) {
        // TODO.
        return null
    }

    static async getMovieGenres(id) {
        return ['Adventure', 'Drama', 'Sci-Fi']
    }
}


module.exports = ImdbService


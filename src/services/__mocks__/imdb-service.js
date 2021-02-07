import movies from ('./movies.json');


class ImdbService {
    static async getMovieByTitle(title) {
        return movies;
    }

    static async getMovieDetails(id) {
        // TODO.
        return null;
    }
}


module.exports = ImdbService;


const Genre = require('./genre')

class MovieGenreList {
    constructor(movie_id) {
        this.movie_id = movie_id
        this.genres = []
    }
    async getGenres() {
        // Do nothing.
    }
    async add(genre) {
        let idx = this.genres.indexOf(genre)
        if (idx !== -1) {
            return
        }
        this.genres.push(genre)
    }
    async remove(genre) {
        // TODO
    }
}

class MovieGenreRelation {
    static saved = []

    constructor(movie_id, genre_id) {
        this.movie_id = movie_id
        this.genre_id = genre_id
    }

    async createIfDoesntExist() {
        await this.save()
    }

    static reset() {
        MovieGenreRelation.saved.length = 0
    }

    async save() {
        MovieGenreRelation.saved.push(this)
    }

    async delete() {
        // TODO
    }

    static async findListByMovieId(movie_id) {
        // TODO
    }
}

module.exports = MovieGenreList

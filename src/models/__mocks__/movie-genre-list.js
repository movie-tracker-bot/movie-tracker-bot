const Genre = require('./genre')
const Util = require('../../helpers/utils')

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
    /**
     * Check if the list contains a given genre by name, case-insensitive.
     * @param {string} name The genre's name
     */
    contains(name) {
        for (let genre of this.genres) {
            if (Util.StringEqualsIgnoreCase(genre.name, name)) {
                return true
            }
        }

        return false
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

const Database = require('./database')
const MovieGenreList = require('./movie-genre-list')
class Movie {
    /**
     * @param {number} id - assingned by database
     * @param {string} imdb_id
     * @param {string} title
     * @param {number} year
     * @param {string} poster_url
     */
    constructor(id = null, imdb_id, title, year = null, poster_url = null) {
        this.id = id
        this.imdb_id = imdb_id
        this.title = title
        this.year = year
        this.poster_url = poster_url
        this.genreList = null
    }
    async createIfDoesntExist() {
        try {
            let existing_movie = await Movie.findByImdbId(this.imdb_id)

            if (!existing_movie) {
                await this.save()
            }
            else {
                this.id = existing_movie.id
                this.title = existing_movie.title
                this.year = existing_movie.year
                this.poster_url = existing_movie.poster_url
                this.genreList = existing_movie.genreList
            }
        } catch (err) {
            console.log(err)
            console.log('error while creating movie')
        }
    }
    async save() {
        try {
            const db = await Database.getDatabase()
            await db.run(`INSERT INTO movie(imdb_id, title, year, poster_url)
                    VALUES (?, ?, ?, ?)`, [this.imdb_id, this.title, this.year, this.poster_url])
            db.close()
            let movie = await Movie.findByImdbId(this.imdb_id)
            this.id = movie.id
            this.genreList = new MovieGenreList(this.id)
        } catch (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                console.log('Movie already exists.')
            }
            else {
                console.log(err)
                console.log('Error while saving movie')
            }
        }
    }
    /**
     * @param {string} imdb_id
     */
    static async findByImdbId(imdb_id) {
        try {
            const db = await Database.getDatabase()
            let result = await db.get('SELECT * FROM movie WHERE imdb_id = ?', [imdb_id])
            var movie = null
            if (result) {
                movie = new Movie(result.id, result.imdb_id, result.title, result.year, result.poster_url)
                await movie.fillGenreList()
            }
            db.close()
            return movie
        } catch (err) {
            console.log(err)
            console.log('Error on retrieving movie')
            return null
        }
    }
    /**
     * @param {number} id
     */
    static async findById(id) {
        try {
            const db = await Database.getDatabase()
            let result = await db.get('SELECT * FROM movie WHERE id = ?', [id])
            var movie = null
            if (result) {
                movie = new Movie(result.id, result.imdb_id, result.title, result.year, result.poster_url)
                await movie.fillGenreList()
            }
            db.close()
            return movie
        } catch (err) {
            console.log('Error on retrieving movie')
            return null
        }
    }


    static async findByTitle(title) {
        try {
            const db = await Database.getDatabase()
            let result = await db.get('SELECT * FROM movie WHERE title = ?', [title])
            var movie = null
            if (result) {
                movie = new Movie(result.id, result.imdb_id, result.title, result.year, result.poster_url)
                await movie.fillGenreList()
            }
            db.close()
            return movie
        } catch (err) {
            console.log('Error on retrieving movie')
            return null
        }
    }


    async fillGenreList() {
        this.genreList = new MovieGenreList(this.id)
        await this.genreList.getGenres()
    }
}

module.exports = Movie

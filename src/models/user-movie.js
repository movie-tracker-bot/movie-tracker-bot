const Database = require('./database')
const User = require('./user')
const Movie = require('./movie')
const Genre = require('./genre')

class UserMovie {
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

    async createIfDoesntExist() {
        try {
            let existingUserMovie = await UserMovie.findByUserTelegramIdAndMovieId(this.user_id, this.movie_id)
            if (!existingUserMovie) {
                await this.save()
            }
            else {
                this.id = existingUserMovie.id
                this.user_id = existingUserMovie.user_id
                this.movie_id = existingUserMovie.movie_id
                if (this.watched && !existingUserMovie.watched) {
                    await this.updateWatched()
                }
                else {
                    this.watched = existingUserMovie.watched
                }
                if (this.score && this.score != existingUserMovie.score) {
                    this.updateScore()
                }
                else {
                    this.score = existingUserMovie.score
                }
            }

        } catch (err) {
            console.log(err)
            console.log('Error while checking user movie')
        }
    }

    async save() {
        try {
            const db = await Database.getDatabase()
            await db.run(`INSERT INTO user_movie(user_id, movie_id, watched, score)
                    VALUES (?, ?, ?, ?)`, [this.user_id, this.movie_id, this.watched, this.score])
            db.close()
            let userMovie = await UserMovie.findByUserTelegramIdAndMovieId(this.user_id, this.movie_id)
            this.id = userMovie.id
        } catch (err) {
            console.log(err)
            console.log('Error while saving movie into user list')
        }
    }

    async delete() {
        try {
            const db = await Database.getDatabase()
            await db.run('DELETE FROM user_movie WHERE id = ?', [this.id])
            db.close()
        } catch (err) {
            console.log(err)
            console.log('Error while deleting movie of user list')
        }
    }

    static async findByUserTelegramIdAndMovieId(user_telegram_id, movie_id) {
        try {
            const db = await Database.getDatabase()
            let result = await db.get('SELECT * FROM user_movie WHERE user_id = ? AND movie_id = ?', [user_telegram_id, movie_id])
            var userMovie = null
            if (result) {
                var user = await User.findByTelegramId(user_telegram_id)
                var movie = await Movie.findById(movie_id)
                userMovie = new UserMovie(result.id, user, movie, result.watched, result.score)
            }
            db.close()
            return userMovie
        } catch (err) {
            console.log(err)
            console.log('An error occurred while consulting movie in user list')
        }
    }

    static async findUnwatchedRandomByTelegramId(user_telegram_id) {
        try {
            const db = await Database.getDatabase()
            let result = await db.get(
                'SELECT * FROM user_movie WHERE user_id = ? and watched = 0 ORDER BY RANDOM() LIMIT 1',
                [user_telegram_id]
            )
            var userMovie = null
            if (result) {
                var user = await User.findByTelegramId(user_telegram_id)
                var movie = await Movie.findById(result.movie_id)
                userMovie = new UserMovie(result.id, user, movie, result.watched, result.score)
            }
            db.close()
            return userMovie
        } catch (err) {
            console.log(err)
            console.log('An error occurred while consulting movie in user list')
        }
    }

    static async findUnwatchedRandomByTelegramIdAndGenre(user_telegram_id, genre) {
        try {
            const db = await Database.getDatabase()

            const genreObj = await Genre.findByName(genre)

            if (!genreObj) {
                return null
            }

            let result = await db.get(
                `select um.id, um.movie_id, um.watched, um.score
                 from user_movie as um
                 inner join movie_genre as mg
                 on um.movie_id = mg.movie_id
                 where um.user_id = ?
                   and um.watched = 0
                   and mg.genre_id = ?
                 order by random()
                 limit 1`,
                [user_telegram_id, genreObj.id]
            )
            var userMovie = null
            if (result) {
                var user = await User.findByTelegramId(user_telegram_id)
                var movie = await Movie.findById(result.movie_id)
                userMovie = new UserMovie(result.id, user, movie, result.watched, result.score)
            }
            db.close()
            return userMovie
        } catch (err) {
            console.log(err)
            console.log('An error occurred while consulting movie in user list')
        }
    }

    /**
     * 
     * @param {Number} user_telegram_id 
     */
    static async findMovieListByUserTelegramId(user_telegram_id) {
        try {
            const db = await Database.getDatabase()
            let results = await db.all('SELECT * FROM user_movie WHERE user_id = ?', [user_telegram_id])
            var movieList = []
            if (Array.isArray(results)) {
                for (let i = 0; i < results.length; i++) {
                    let movie = await Movie.findById(results[i].movie_id)
                    if (movie) {
                        movie.score = results[i].score
                        movie.watched = results[i].watched
                        movieList.push(movie)
                    }
                }
            }
            return movieList
        } catch (err) {
            console.log(err)
            console.log('An error occurred while getting user_movie list')
        }
    }

    /**
     * 
     * @param {Number} user_telegram_id 
     * @param {Boolean} watched 
     */
    static async findMovieListByUserTelegramIdAndWatched(user_telegram_id, watched) {
        try {
            const db = await Database.getDatabase()
            let results = await db.all('SELECT * FROM user_movie WHERE user_id = ? AND watched = ?', [user_telegram_id, watched])
            var movieList = []
            if (Array.isArray(results)) {
                for (let i = 0; i < results.length; i++) {
                    let movie = await Movie.findById(results[i].movie_id)
                    movieList.push(movie)
                }
            }
            return movieList
        } catch (err) {
            console.log(err)
            console.log('An error occurred while getting user_movie list')
        }
    }

    /**
     * 
     * @param {Number} user_telegram_id 
     */
    static async findMovieListByUserTelegramIdAndScoreNotNull(user_telegram_id) {
        try {
            const db = await Database.getDatabase()
            let results = await db.all('SELECT * FROM user_movie WHERE user_id = ? AND score IS NOT NULL', [user_telegram_id])
            var movieList = []
            if (Array.isArray(results)) {
                for (let i = 0; i < results.length; i++) {
                    let movie = await Movie.findById(results[i].movie_id)
                    movie.score = results[i].score
                    movieList.push(movie)
                }
            }
            return movieList
        } catch (err) {
            console.log(err)
            console.log('An error occurred while getting user_movie list')
        }
    }

    async updateScore() {
        try {
            const db = await Database.getDatabase()
            await db.run('UPDATE user_movie SET score = ? WHERE id = ?;', [this.score, this.id])
            db.close()
        } catch (err) {
            console.log(err)
            console.log('An error occurred while trying to update movie score')
        }

    }

    async updateWatched() {
        try {
            const db = await Database.getDatabase()
            await db.run('UPDATE user_movie SET watched = ? WHERE id = ?;', [this.watched, this.id])
            db.close()
        } catch (err) {
            console.log(err)
            console.log('An error occurred while trying to update movie watched')
        }
    }
}

module.exports = UserMovie

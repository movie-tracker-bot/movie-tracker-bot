const Database = require("./database")
const User = require("./user")
const Movie = require("./movie")

class UserMovie {
    /**
     * @param {number} id - assigned by database 
     * @param {User} user - user already on database
     * @param {Movie} movie - movie already on database
     * @param {boolean} watched - if user has watched the movie. Default false 
     * @param {number} score - score given by user 
     */
    constructor (id = null, user = null, movie = null, watched = false, score = null) {
        this.id = id
        this.user = user
        this.movie = movie
        this.watched = watched
        this.score = score
    }

    async createIfDoesntExist(){
        try {
            let existingUserMovie = await UserMovie.findByUserTelegramIdAndMovieId(this.user_id, this.movie_id)
            if (!existingUserMovie){
                await this.save()
            }
            else{
                this.id = existingUserMovie.id
                this.user_id = existingUserMovie.user_id
                this.movie_id = existingUserMovie.movie_id
                this.watched = existingUserMovie.watched
                this.score = existingUserMovie.score
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
                    VALUES (?, ?, ?, ?)`, [this.user.telegram_id, this.movie.id, this.watched, this.score])
            db.close()
            let userMovie = await UserMovie.findByUserTelegramIdAndMovieId(this.user.telegram_id,this.movie.id)
            this.id = userMovie.id
        } catch (err) {
            console.log(err)
            console.log('Error while saving movie into user list')
        }
    }

    static async findByUserTelegramIdAndMovieId(user_telegram_id, movie_id) {
        try{
            const db = await Database.getDatabase()
            let result = await db.get('SELECT * FROM user_movie WHERE user_id = ? AND movie_id = ?', [user_telegram_id, movie_id])
            var userMovie = null
            if(result){
                var user = await User.findByTelegramId(user_telegram_id)
                var movie = await Movie.findById(movie_id)
                userMovie = new UserMovie(result.id, user, movie, result.watched, result.score)
            }
            db.close()
            return userMovie
        } catch(err){
            console.log(err)
            console.log("An error occurred while consulting movie in user list")
        }
    }

}

module.exports = UserMovie
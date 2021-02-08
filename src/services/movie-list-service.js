const User = require("../models/user")
const Genre = require("../models/genre")
const UserMovie = require("../models/user-movie")

class MovieListService{
    /**
     * 
     * @param {User} user 
     */
    constructor(user=null){
        this.user = user
        this.movieList = []
    }
    /**
     * 
     * @param {number} maxLength - lenght of list. If null, will get full list
     * @param {boolean} watched - if list is of watched or unwatched movies, if null will get both
     */
    async getList(maxLength = 10, watched = null){
        if (watched === null){
            this.movieList = await UserMovie.findMovieListByUserTelegramId(this.user.telegram_id)
        }
        else{
            this.movieList = await UserMovie.findMovieListByUserTelegramIdAndWatched(this.user.telegram_id, watched)
        }
        if(maxLength !== null & maxLength<this.movieList.length){
            this.movieList.splice(maxLength,this.movieList.length - maxLength)
        }
        return this.movieList
    }
    /**
     * 
     * @param {Genre} genre 
     * @param {Number} maxLength - lenght of list. If null, will get full list
     * @param {Boolean} watched - if list is of watched or unwatched movies, if null will get both
     */
    async getListByGenre(genre, maxLength = 10, watched = null){

    }
    /**
     * 
     * @param {Genre} genre 
     */
    async filterByGenre(genre){

    }

    /**
     * @param {Number} maxLength - lenght of list. If null, will get full list
     */
    async getListByScore(maxLength = 10){

    }
    async sortByScore(){

    }
}

module.exports = MovieListService
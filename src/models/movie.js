const Database = require('./database')
const Genre = require('./genre')
class Movie{
    /**
     * @param {number} id - assingned by database
     * @param {string} imdb_id
     * @param {string} title
     * @param {number} year
     * @param {string} poster_url
     */
    constructor(id=null,imdb_id,title,year=null,poster_url=null){
        this.id = id
        this.imdb_id = imdb_id
        this.title = title
        this.year = year
        this.poster_url = poster_url
    }
    async save(){
        try {
            const db = await Database.getDatabase()
            await db.run(`INSERT INTO movie(imdb_id, title, year, poster_url)
                    VALUES (?, ?, ?, ?)`,[this.imdb_id, this.title, this.year, this.poster_url])
            db.close()
            let movie = await Movie.findByImdbId(this.imdb_id)
            this.id = movie.id
        } catch (err) {
            console.log(err)
            console.log("Error while saving movie")
        }
    }
    /**
     *
     * @param {string[]} genreNames
     */
    async saveGenres(genreNames){
        this.genres = []
        genreNames.forEach((genreName)=>{
            let genre = Genre.findByName(genreName)
            if(!genre){
                genre = new Genre(null,genreName)
                genre.save()
            }
            relation = new MovieGenreRelation(this.id, genre.id)
            relation.save()
            this.genres.push(genre)
        })
    }
    /**
     * Encontra generos do filme, retorna vetor de Genre e
     * também atribui esse vetor ao atributo genres
     */
    async findGenres(){
        this.genres =  await MovieGenreRelation.findByMovieId(this.id)
        return this.genres
    }

    /**
     * @param {string} imdb_id
     */
    static async findByImdbId(imdb_id){
        try{
            const db = await Database.getDatabase()
            let result = await db.get(`SELECT * FROM movie WHERE imdb_id = ?`,[imdb_id])
            var movie = null
            if (result){
                movie = new Movie(result.id,result.imdb_id,result.title,result.year,result.poster_url)
                await movie.findGenres()
            }
            db.close()
            return movie
        }catch(err){
            console.log("Error on retrieving movie")
            return null
        }
    }
    /**
     * @param {number} id
     */
    static async findById(id){
        try{
            const db = await Database.getDatabase()
            let result = await db.get(`SELECT * FROM movie WHERE id = ?`,[id])
            var movie = null
            if (result){
                movie = new Movie(result.id,result.imdb_id,result.title,result.year,result.poster_url)
                await movie.findGenres()
            }
            db.close()
            return movie
        }catch(err){
            console.log("Error on retrieving movie")
            return null
        }
    }
}

class MovieGenreRelation{
    constructor(movie_id, genre_id){
        this.movie_id = movie_id
        this.genre_id = genre_id
    }
    async save(){
        try {
            const db = await Database.getDatabase()
            await db.run(`INSERT INTO movie_genre(movie_id, genre_id)
                    VALUES (?, ?)`,[this.movie_id, this.genre_id])
            db.close()
        } catch (err) {
            console.log(err)
            console.log("Error while saving relationship between movie and genre")
        }
    }
    static async findByMovieId(movie_id){
        try{
            const db = await Database.getDatabase()
            let results = await db.all(`SELECT * FROM movie_genre WHERE movie_id = ?`,[movie_id])
            var genres = []
            if (Array.isArray(results)){
                results.forEach((result)=>{
                    let genre = Genre.findById(result.genre_id)
                    genres.push(genre)
                })
            }
            db.close()
            return genres
        }catch(err){
            console.log("Error on retrieving genre")
            return null
        }
    }
}

module.exports = Movie

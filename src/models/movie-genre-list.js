const Database = require('./database')
const Genre = require('./genre')
class MovieGenreList{
    constructor(movie_id){
        this.movie_id = movie_id
        this.genres = []
    }
    async getGenres(){
        this.genres = await MovieGenreRelation.findListByMovieId(this.movie_id)
    }
    async add(genre){
        try{
            let idx = this.genres.indexOf()
            if(idx!==-1){
                return
            }
            if (!genre.id){
                await genre.createIfDoesntExist()
            }
            let relation = new MovieGenreRelation(this.movie_id,genre.id)
            relation.createIfDoesntExist()
            this.genres.push(genre)
        }catch(err){
            console.log(err)
            console.log("Error occurred trying to add genre movie relationship")
        }   
    }

    async remove(genre){
        try{
            if (!genre.id){
                let new_genre = await Genre.findByName(genre.name)
                if (new_genre){
                    genre.id = new_genre.id
                }
                else{
                    return
                }
            }
            let idx = -1;
            for(let i =0; i< this.genres.length;i++){
                if(this.genres[i].id === genre.id){
                    idx = i
                }
            }
            if(idx===-1){
                return
            }
            else{
                this.genres.splice(idx,1)
                let relation = new MovieGenreRelation(this.movie_id,genre.id)
                await relation.delete()
            }
        }catch(err){
            console.log(err)
            console.log("Error occurred trying to remove movie genre relation")
        }   
    }
}

class MovieGenreRelation{
    constructor(movie_id, genre_id){
        this.movie_id = movie_id
        this.genre_id = genre_id
    }

    async createIfDoesntExist(){
        try{
            const db = await Database.getDatabase()
            let result = await db.get(`SELECT * FROM movie_genre WHERE movie_id = ? AND genre_id = ?`,[this.movie_id, this.genre_id])
            if (!result){
                await this.save()
            }
        }catch(err){
            console.log(err)
            console.log("Error while checking relationship between movie and genre")
        }
        
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

    async delete(){
        try {
            const db = await Database.getDatabase()
            await db.run(`DELETE FROM movie_genre
                    WHERE movie_id = ? AND genre_id = ?`,[this.movie_id, this.genre_id])
            db.close()
        } catch (err) {
            console.log(err)
            console.log("Error while saving relationship between movie and genre")
        }
    }

    static async findListByMovieId(movie_id){
        try{
            const db = await Database.getDatabase()
            let results = await db.all(`SELECT * FROM movie_genre WHERE movie_id = ?`,[movie_id])
            var genres = []
            if (Array.isArray(results)){
                results.forEach(async(result)=>{
                    let genre = await Genre.findById(result.genre_id)
                    genres.push(genre)
                })
            }
            db.close()
            return genres
        }catch(err){
            console.log("Error on retrieving genres")
            return []
        }
    }
}

module.exports = MovieGenreList
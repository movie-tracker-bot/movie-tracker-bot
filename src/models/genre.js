const Database = require('./database')
class Genre{
    /**
     * @param {number} id given by the database
     * @param {string} name
    */
    constructor(id=null,name){
        this.id = id
        this.name = name
    }
    async save(){
        try {
            const db = await Database.getDatabase()
            await db.run(`INSERT INTO genre(name)
                    VALUES (?)`,[this.name])
            db.close()
            let genre = await this.findByName(this.name)
            this.id = genre.id
        } catch (err) {
            console.log(err)
            console.log("Error while saving genre")
        }
    }
    /**
     * 
     * @param {string} name 
     */
    static async findByName(name){
        try{
            const db = await Database.getDatabase()
            let result = await db.get(`SELECT * FROM genre WHERE name = ?`,[name])
            var genre = null
            if (result){
                genre = new Genre(result.id,result.name)
            }
            db.close()
            return genre
        }catch(err){
            console.log("Error on retrieving genre")
            return null
        }  
    }
    /**
     * 
     * @param {number} id 
     */
    static async findById(id){
        try{
            const db = await Database.getDatabase()
            let result = await db.get(`SELECT * FROM genre WHERE id = ?`,[id])
            var genre = null
            if (result){
                genre = new Genre(result.id,result.name)
            }
            db.close()
            return genre
        }catch(err){
            console.log("Error on retrieving genre")
            return null
        }  
    }
}
module.exports = Genre
const Database = require('./database')
const Movie = require('./movie')
class User{
    /**
     * @param {number} telegram_id 
     * @param {string} first_name 
     */
    constructor (telegram_id,first_name){
        this.telegram_id = telegram_id
        this.first_name = first_name
    }
    async save(){
        try {
            const db = await Database.getDatabase()
            db.run(`INSERT INTO user(telegram_id, first_name)
                    VALUES (?, ?)`,[this.telegram_id, this.first_name])
            db.close()
        } catch (err) {
            console.log(err)
            console.log("Error while saving user")
        }
    }
    /**
     * @param {number} telegram_id
     */
    static async findByTelegramId(telegram_id){
        try{
            const db = await Database.getDatabase()
            let result = await db.get(`SELECT * FROM user WHERE telegram_id = ?`,[telegram_id])
            var user = null
            if (result){
                user = new User(result.telegram_id,result.first_name)
            }
            db.close()
            return user
        }catch(err){
            console.log("Error on retrieving user")
            return null
        }  
    }
}
module.exports = User
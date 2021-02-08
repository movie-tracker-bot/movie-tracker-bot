const Database = require('./database')
class User {
    /**
     * @param {number} telegram_id 
     * @param {string} first_name 
     */
    constructor(telegram_id, first_name) {
        this.telegram_id = telegram_id
        this.first_name = first_name
    }
    
    async createIfDoesntExist(){
        try{
            var existingUser = await User.findByTelegramId(this.telegram_id)
            if (!existingUser){
                await this.save()
            }
            else{
                this.telegram_id = existingUser.telegram_id
                this.first_name = existingUser.first_name
            }
        } catch(err){
            console.log(err)
            console.log('Error while checking user')
        }
    }

    async save() {
        try {
            const db = await Database.getDatabase()
            db.run(`INSERT INTO user(telegram_id, first_name)
                    VALUES (?, ?)`, [this.telegram_id, this.first_name])
            db.close()
        } catch (err) {
            console.log(err)
            console.log('Error while saving user, problably already exists')
        }
    }
    /**
     * @param {number} telegram_id
     */
    static async findByTelegramId(telegram_id) {
        try {
            const db = await Database.getDatabase()
            let result = await db.get('SELECT * FROM user WHERE telegram_id = ?', [telegram_id])
            var user = null
            if (result) {
                user = new User(result.telegram_id, result.first_name)
            }
            db.close()
            return user
        } catch (err) {
            console.log('Error on retrieving user')
            return null
        }
    }
}
module.exports = User

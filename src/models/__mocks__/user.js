class User {
    static saved = [];

    /**
     * @param {number} telegram_id
     * @param {string} first_name
     */
    constructor(telegram_id, first_name) {
        this.telegram_id = telegram_id
        this.first_name = first_name
    }

    static reset() {
        User.saved.length = 0
    }

    async save() {
        User.saved.push(this)
    }

    async createIfDoesntExist() {
        this.save()
    }

    /**
     * @param {number} telegram_id
     */
    static async findByTelegramId(telegram_id) {
        // TODO.
        return null
    }
}


module.exports = User

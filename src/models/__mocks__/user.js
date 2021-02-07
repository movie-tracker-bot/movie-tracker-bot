class User {
    /**
     * @param {number} telegram_id
     * @param {string} first_name
     */
    constructor (telegram_id,first_name) {
        this.telegram_id = telegram_id;
        this.first_name = first_name;
        this.saved = false;
    }

    async save() {
        this.saved = true;
    }

    /**
     * @param {number} telegram_id
     */
    static async findByTelegramId(telegram_id) {
        // TODO.
        return null;
    }
}


module.exports = User;

class Genre {
    static saved = []

    /**
     * @param {number} id given by the database
     * @param {string} name
    */
    constructor(id = null, name) {
        this.id = id
        this.name = name
    }

    async createIfDoesntExist() {
        await this.save()
    }

    static reset() {
        Genre.saved.length = 0
    }

    async save() {
        Genre.saved.push(this)
    }

    /**
     * 
     * @param {string} name 
     */
    static async findByName(name) {
        // TODO
    }
    /**
     * 
     * @param {number} id 
     */
    static async findById(id) {
        // TODO
    }
}
module.exports = Genre

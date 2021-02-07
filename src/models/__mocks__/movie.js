class Movie {
    /**
     * @param {number} id - assingned by database
     * @param {string} imdb_id
     * @param {string} title
     * @param {number} year
     * @param {string} poster_url
     */
    constructor(id = null, imdb_id, title, year = null, poster_url = null) {
        this.id = id;
        this.imdb_id = imdb_id;
        this.title = title;
        this.year = year;
        this.poster_url = poster_url;
        this.genreList = null;

        this.saved = false;
    }


    async createIfDoesntExist() {
        await this.save();
    }

    async save() {
        this.saved = true;
    }

    /**
     * @param {string} imdb_id
     */
    static async findByImdbId(imdb_id) {
        // TODO
        return null;
    }

    /**
     * @param {number} id
     */
    static async findById(id) {
        // TODO
        return null;
    }

    async fillGenreList() {
        // TODO
        return null;
    }
}

module.exports = Movie;

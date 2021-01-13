const ImdbService = require('../services/imdb-service')

class BotHandler {
    /**
     * Retorna mensagem de Boas Vindas do Bot
     */
    async getStartMessage() {

    }


    static handlers = {
        add: {
            pattern: /^add (.*)$/i,
            handler: BotHandler.addMovie,
        },
    }


    static async addMovie(ctx) {
        const query = ctx.match[1];

        console.log(`Add command: ${query}`);

        const imdbService = new ImdbService();

        const results = await imdbService.getMovieByTitle(query);

        const movie = results[0];

        await ctx.reply(movie.title);
        if (movie.image) {
            await ctx.replyWithPhoto(movie.image.url);
        }
        await ctx.reply('Is this the correct movie?');
    }
}
module.exports = BotHandler

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

        const results = await ImdbService.getMovieByTitle(query);

        const movie = results[0];

        await ctx.reply(movie.title);
        if (movie.image) {
            await ctx.replyWithPhoto(movie.image.url);
        }
        await ctx.reply('Is this the correct movie?');
    }

    static async start(ctx) {
        const welcomeMessage = `Bem vindo ao movie tracker, o melhor assistente de filmes do telegram, 
        nele você poderá gerenciar sua lista de filmes que quer assistir, obter recomendações que melhor 
        se adequa ao seu gosto.  Para isso temos os seguintes comandos:\n
            * /add seguido do nome do um filme que queira adicionar  a sua lista\n
            * /remove seguido do nome do filme que deseja remover da sua lista\n
            * /score seguido do nome do filme  e a avaliação que gostaria de dar para ele. 
            * /list para visualizar todos os filmes cadastrados.\n
            * /rand para obter a recomendação de um filme.\n
            * /rand seguido de um gênero ou nome de um artista, para obter uma recomendação com uma característica específica.\n
            * /myRank  para visualizar a lista de avaliações já feitas.\n`
        await ctx.reply(welcomeMessage);
    }
}
module.exports = BotHandler

const ImdbService = require('../services/imdb-service');

class BotHandler {
    /**
     * Initializes the BotHandler, registering endpoints to the given telegraf instance.
     * To launch the bot, call `launch`.
     * To stop the bot, call `stop`.
     * @param {Telegraf} telegraf the telegraf instance
    */
    constructor(telegraf) {
        this.telegraf = telegraf;

        this.state = {};

        this.telegraf.start(BotHandler.start);

        const handlers = {
            add: {
                pattern: /^add (.*)$/i,
                handler: BotHandler.addMovie,
            },
        };

        for (let endpoint of Object.values(handlers)) {
            this.telegraf.hears(
                endpoint.pattern,
                endpoint.handler
            );
            console.log(`Registering handler for ${endpoint.pattern}`);
        }

        this.telegraf.on(
            'text',
            this.text.bind(this)
        );
    }


    static async start(ctx) {
        const welcomeMessage = `Bem vindo ao movie tracker, o melhor assistente de filmes do telegram,
        nele você poderá gerenciar sua lista de filmes que quer assistir, obter recomendações que melhor
        se adequa ao seu gosto.  Para isso temos os seguintes comandos:\n
            - **add** seguido do nome do um filme que queira adicionar  a sua lista\n
            - **remove** seguido do nome do filme que deseja remover da sua lista\n
            - **score** seguido do nome do filme  e a avaliação que gostaria de dar para ele.\n
            - **list** para visualizar todos os filmes cadastrados.\n
            - **rand** para obter a recomendação de um filme.\n
            - **rand** seguido de um gênero ou nome de um artista, para obter uma recomendação com uma característica específica.\n
            - **myRank**  para visualizar a lista de avaliações já feitas.\n`;
        await ctx.replyWithMarkdown(welcomeMessage);
    }


    async text(ctx) {
        console.log(`text handler: ${ctx.message.text}`);

        const user = ctx.from.id;

        if (this.state[user]) {
            console.log('Dispatching to state handler...');
            await this.state[user].next(ctx);
        }
        else {
            console.log('No state for current user.');
            await ctx.reply("Sorry, I don't understand.");
        }
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


    async launch() {
        await this.telegraf.launch();
    }


    async stop() {
        await this.telegraf.stop();
    }
}


module.exports = BotHandler;

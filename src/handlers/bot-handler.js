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
                handler: this.addMovie,
            },
        };

        for (let endpoint of Object.values(handlers)) {
            this.telegraf.hears(
                endpoint.pattern,
                endpoint.handler.bind(this)
            );
            console.log(`Registering handler for ${endpoint.pattern}`);
        }

        this.telegraf.on(
            'text',
            this.text.bind(this)
        );
    }


    static async start(ctx) {
        const welcomeMessage = [
            [ 'Bem vindo ao movie tracker, o melhor assistente de filmes do telegram,',
              'nele você poderá gerenciar sua lista de filmes que quer assistir,',
              'obter recomendações que melhor se adequa ao seu gosto.',
              'Para isso temos os seguintes comandos:' ].join(' '),
            '- **add** seguido do nome do um filme que queira adicionar  a sua lista',
            '- **remove** seguido do nome do filme que deseja remover da sua lista',
            '- **score** seguido do nome do filme  e a avaliação que gostaria de dar para ele.',
            '- **list** para visualizar todos os filmes cadastrados.',
            '- **rand** para obter a recomendação de um filme.',
            '- **rand** seguido de um gênero ou nome de um artista, para obter uma recomendação com uma característica específica.',
            '- **myRank**  para visualizar a lista de avaliações já feitas.'
        ].join('\n');
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


    static async askMovieConfirmation(ctx, state) {
        const movie = state.movie_list[state.movie_ix];

        if (movie.title) {
            await ctx.reply(movie.title);
        }

        if (movie.image) {
            await ctx.replyWithPhoto(movie.image.url);
        }

        await ctx.reply('Is this the correct movie?');
    }

    async addMovie(ctx, next) {
        const user = ctx.from.id;

        if (this.state[user]) { // Previous action is still ongoing.
            await next();
            return;
        }

        const query = ctx.match[1];

        console.log(`Add command: ${query}`);

        const state = this.state[user] = {
            movie_ix: 0,
            movie_list: await ImdbService.getMovieByTitle(query),
        };

        BotHandler.askMovieConfirmation(ctx, state);

        state.next = this.confirmMovie.bind(this);
    }


    async confirmMovie(ctx) {
        const user = ctx.from.id;

        const message = ctx.message.text;

        console.log(`Got confirmation message: ${message}`);

        const positive_answer = /^(yes+|yep|yeah)$/i;
        const negative_answer = /^(no+|nope|nah)$/i;
        const cancel_answer = /^(cancel)$/i;

        if (positive_answer.test(message)) {
            // TODO: add to DB.
            await ctx.reply('Got it!');
            delete this.state[user];
        }
        else if (negative_answer.test(message)) {
            const state = this.state[user];
            state.movie_ix++;

            if (state.movie_list.length == state.movie_ix) {
                await ctx.reply("Well, I ain't got any other suggestions...");
                delete this.state[user];
            }
            else {
                BotHandler.askMovieConfirmation(ctx, state);
            }
        }
        else if (cancel_answer.test(message)) {
            await ctx.reply('Cancelling...');
            delete this.state[user];
        }
        else {
            await ctx.reply("I don't get it, sorry :s");
        }
    }


    async launch() {
        await this.telegraf.launch();
    }


    async stop() {
        await this.telegraf.stop();
    }
}


module.exports = BotHandler;

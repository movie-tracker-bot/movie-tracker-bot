class BotHandler {
    /**
     * Retorna mensagem de Boas Vindas do Bot
     */
    async getStartMessage() {

    }


    static handlers = {
        add: {
            pattern: /^add .*$/i,
            handler: BotHandler.addMovie,
        },
    }


    static async addMovie(ctx) {
        await ctx.reply(ctx.message.text); // Just echo for now.
    }
}
module.exports = BotHandler

const { Telegraf } = require('telegraf')
const Database = require('./models/database')
const BotHandler = require('./handlers/bot-handler')

Database.init()

// Bot definition.
const bot = new BotHandler(
    new Telegraf(process.env.BOT_TOKEN)
)

// Handle ctrl-c.
process.on(
    'SIGINT',
    async () => {
        await bot.stop()
        process.exit(130)
    }
)

bot.launch()

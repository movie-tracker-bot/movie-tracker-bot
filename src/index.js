const { Telegraf } = require('telegraf');

// Bot definition.
const bot = new Telegraf(process.env.BOT_TOKEN);


// Register interactions.
bot.start(
	async (ctx) => {
		await ctx.reply('Welcome');
	}
);

bot.help(
	async (ctx) => {
		await ctx.reply('Send me a sticker');
	}
);

bot.on(
	'sticker',
	async (ctx) => {
		await ctx.reply('👍');
	}
);

bot.hears(
	'hi',
	async (ctx) => {
		await ctx.reply('Hey there');
	}
);


// Handle ctrl-c.
process.on(
	'SIGINT',
	async () => {
		await bot.stop();
		process.exit(130);
	}
);


// Bot setup.
bot.launch();

const telegram = require('./telegram');
const BotHandler = require('./handlers/bot-handler');


telegram.register(BotHandler.handlers);

// Handle ctrl-c.
process.on(
	'SIGINT',
	async () => {
		await telegram.stop();
		process.exit(130);
	}
);

telegram.launch();

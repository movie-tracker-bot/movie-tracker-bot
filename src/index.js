const telegram = require('./telegram');
const endpoints = require('./endpoints');


telegram.register(endpoints.handlers);

// Handle ctrl-c.
process.on(
	'SIGINT',
	async () => {
		await telegram.stop();
		process.exit(130);
	}
);

telegram.launch();

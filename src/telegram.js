const { Telegraf } = require('telegraf');


// Bot definition.
const bot = new Telegraf(process.env.BOT_TOKEN);


exports.register = function(endpoints) {
	for (let endpoint of Object.values(endpoints)) {
		bot.hears(endpoint.pattern, endpoint.handler);
		console.log(`Registering handler for ${endpoint.pattern}`);
	}
}


exports.launch = async function() {
	await bot.launch();
}


exports.stop = async function() {
	await bot.stop();
}

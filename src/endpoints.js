const handlers = {
	add: {
		pattern: /^add .*$/i,
		handler: async (ctx) => {
			await ctx.reply(ctx.message.text); // Just echo for now.
		}
	},
}


exports.handlers = handlers;

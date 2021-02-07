class Context {
    constructor(message, matches, id = 0, username = 'rogerinhodoinga', firstName = 'Rogerinho') {
        this.message = {
            text: message,
        };

        this.match = matches;

        this.from = {
            id: id,
            username: username,
            first_name: firstName,
        };

        this.replies = {
            text: [],
            markdown: [],
            photos: [],
        };
    }


    async replyWithMarkdown(message) {
        this.replies.markdown.push(message);
    }


    async reply(message) {
        this.replies.text.push(message);
    }

    async replyWithPhoto(message) {
        this.replies.photos.push(message);
    }
}


class Telegraf {
    constructor(token) {
        this.on_patterns = [];
        this.running = false;
    }


    start(start_handler) {
        if (this.running)
            throw new Error('Attempt to register action while running!');

        this.on_start = start_handler;
    }


    hears(pattern, handler) {
        if (this.running)
            throw new Error('Attempt to register action while running!');

        this.on_patterns.push([pattern, handler]);
    }


    on(action, handler) {
        if (this.running)
            throw new Error('Attempt to register action while running!');

        switch (action) {
            case 'text':
                this.on_text = handler;
                break;

            default:
                throw new Error(`Unknown telegram action: ${action}`);
        }
    }


    async launch() {
        if (this.running)
            throw new Error('Duplicate call to launch!');

        this.running = true;
    }


    async stop() {
        if (!this.running)
            throw new Error('Attempt to stop a bot that was not launched!');

        this.running = false;
    }


    async sendStart() {
        let ctx = new Context('/start', null);

        await this.on_start(ctx);

        return ctx.replies;
    }


    async sendMessage(message) {
        for (const [pattern, handler] of this.on_patterns) {
            let matches = pattern.exec(message);

            if (matches) {
                let skipped = false;

                let ctx = new Context(message, matches);

                let next = () => {
                    skipped = true;
                };

                await handler(ctx, next);

                if (!skipped)
                    return ctx.replies;
            }
        }

        let ctx = new Context(message, null);

        await this.on_text(ctx);

        return ctx.replies;
    }
}


module.exports = { Telegraf };

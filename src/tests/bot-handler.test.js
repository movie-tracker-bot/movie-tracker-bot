const { Telegraf } = require('telegraf');
const BotHandler = require('../handlers/bot-handler');
const User = require('../models/user');
jest.mock('../models/user');


const telegraf = new Telegraf("token");
const bot = new BotHandler(telegraf);

beforeAll(() => {
    bot.launch();
});

afterAll(() => {
    bot.stop();
});


test(
    'test start message',
    async () => {
        const replies = await telegraf.sendStart();

        expect(replies.markdown.length).not.toEqual(0);
        expect(replies.photos.length).toEqual(0);
        expect(replies.text.length).toEqual(0);
    }
);


test(
    'test add endpoint pattern',
    () => {
        const { pattern, handler } = bot.handlers.add;

        const shouldMatch = [
            'add movie',
            'Add movie',
            'AdD very long movie name with too many words',
        ];

        const shouldNotMatch = [
            'addmovie',
            'Addmovie',
            ' Add with leading space',
            'ad movie',
            'addd movie',
        ];

        for (let input of shouldMatch) {
            expect(pattern.test(input)).toBeTruthy();
        }

        for (let input of shouldNotMatch) {
            expect(pattern.test(input)).toBeFalsy();
        }
    }
);

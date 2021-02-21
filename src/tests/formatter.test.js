const Formatter = require('../helpers/formatter')

test(
    'test getMovieId',
    async () => {
        const id = Formatter.getMovieId('/title/tt0816692/');
        expect(id).toEqual('tt0816692')
    }
)

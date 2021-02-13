const ImdbService = require('../../src/services/imdb-service')

describe('Search movie in IMDB API', function () {
    it('movie exits', async function () {
        const data = await ImdbService.getMovieByTitle('Crepusculo')
        expect(data.length).not.toEqual(0)
    })
})

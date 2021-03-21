const Menssages = require('../helpers/messages')

describe('Test Welcome Message', function () {
    it('Test with valid string', async function () {
        const data = Menssages.welcomeMessage()
        expect(data).toEqual(`Welcome to the movie tracker! Here you can manage your movie list and get recommendations for movies. These are all available commands:
        /add + movie name to add to your list.
        /remove + movie name to remove  a movie in your list.
        /score + movie name + score to rate a movie
        /watched + movie name to set a movie as watched
        /list + (all|watched|unwatched|scored) + genre to list your movies
        /rand to get a random recommendation
        /myRank to see your rank`)
    })

})

describe('Test Get Rank', function () {
    it('Test with valid string', async function () {
        const movieList = require('../services/__mocks__/movies-list.json')
        const data = Menssages.rankMovieMessage(movieList)
        expect(data.indexOf('Harry Potter And The Sorcerers Stone - 10')).not.toEqual(-1)
        expect(data.indexOf('Crepuscule - 2')).not.toEqual(-1)
    })
})


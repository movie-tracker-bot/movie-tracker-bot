const { Telegraf } = require('telegraf')
const BotHandler = require('../handlers/bot-handler')
const Movie = require('../models/movie')
const Genre = require('../models/genre')
const User = require('../models/user')
const UserMovie = require('../models/user-movie')
jest.mock('../models/user')
jest.mock('../models/movie')
jest.mock('../models/user-movie')
jest.mock('../models/genre')
jest.mock('../models/movie-genre-list')
jest.mock('../services/imdb-service')



const telegraf = new Telegraf('token')
const bot = new BotHandler(telegraf)

beforeAll(() => {
    bot.launch()
})

afterAll(() => {
    bot.stop()
})

beforeEach(() => {
    User.reset()
    Movie.reset()
    UserMovie.reset()
})


test(
    'test start message',
    async () => {
        const replies = await telegraf.sendStart()

        expect(replies.markdown.length).not.toEqual(0)
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual([])

        expect(Movie.saved.length).toEqual(0)
    }
)


test(
    'test add endpoint pattern',
    () => {
        const { pattern } = bot.handlers.add

        const shouldMatch = [
            'add movie',
            'Add movie',
            'AdD very long movie name with too many words',
            ' Add with leading space',
        ]

        const shouldNotMatch = [
            'addmovie',
            'Addmovie',
            'ad movie',
            'addd movie',
        ]

        for (let input of shouldMatch) {
            expect(pattern.test(input)).toBeTruthy()
        }

        for (let input of shouldNotMatch) {
            expect(pattern.test(input)).toBeFalsy()
        }
    }
)


test(
    'test add movie',
    async () => {
        let replies = await telegraf.sendMessage('add interstellar')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(1)
        expect(replies.text).toEqual(
            expect.arrayContaining(['Interstellar'])
        )

        replies = await telegraf.sendMessage('nope')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(1)
        expect(replies.text).toEqual(
            expect.arrayContaining(['Interstelar'])
        )

        replies = await telegraf.sendMessage('yep')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text.length).toEqual(1)

        expect(Movie.saved.length).toEqual(1)
    }
)


test(
    'test cancel add movie',
    async () => {
        let replies = await telegraf.sendMessage('add interstellar')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(1)
        expect(replies.text).toEqual(
            expect.arrayContaining(['Interstellar'])
        )

        replies = await telegraf.sendMessage('nope')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(1)
        expect(replies.text).toEqual(
            expect.arrayContaining(['Interstelar'])
        )

        replies = await telegraf.sendMessage('cancel')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text.length).toEqual(1)

        expect(Movie.saved.length).toEqual(0)
    }
)


test(
    'test fail to add movie',
    async () => {
        let replies = await telegraf.sendMessage('add interstellar')

        let titles = [
            'Interstellar',
            'Interstelar',
            'Interstellar',
            'Interstellar',
            'Interstelar 2: Operation Terra 2040',
            'Interstellar',
            'Interstellar Wars',
            'Interested In',
            'Inside \'Interstellar\'',
            'Interstelar 3: Zero X',
            'Lolita from Interstellar Space',
            'Transformers: Interstellar',
            'Not Interested',
            'Interstellar',
            'Interstellar',
            'Interstellar',
        ]

        for (let title of titles) {
            expect(replies.markdown).toEqual([])
            expect(replies.photos.length < 2).toBeTruthy()
            expect(replies.text).toEqual(
                expect.arrayContaining([title])
            )

            replies = await telegraf.sendMessage('nah')
        }

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text.length).toEqual(1)

        expect(Movie.saved.length).toEqual(0)
    }
)


test(
    'test rand endpoint pattern',
    () => {
        const { pattern } = bot.handlers.rand

        const shouldMatch = [
            'rand',
            '   rand',
            '   rand   ',
            'rand horror',
            '   rand sci-fi',
            '   rand   drama',
        ]

        const shouldNotMatch = [
            'randmovie',
            'rad',
            'raand',
            'r and',
        ]

        for (let input of shouldMatch) {
            expect(pattern.test(input)).toBeTruthy()
        }

        for (let input of shouldNotMatch) {
            expect(pattern.test(input)).toBeFalsy()
        }
    }
)


test(
    'test rand movie',
    async () => {
        let replies = await telegraf.sendMessage('rand')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text.length).toBeGreaterThan(0)

        let user = new User(1, 'random user')
        let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
        let userMovie = new UserMovie(1, user, movie, false, 5)
        await userMovie.save()

        replies = await telegraf.sendMessage('rand')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(1)
        expect(replies.text).toEqual(
            expect.arrayContaining(['random movie'])
        )
    }
)


test(
    'test rand movie genre',
    async () => {
        let replies = await telegraf.sendMessage('rand horror')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text.length).toBeGreaterThan(0)

        let user = new User(1, 'random user')

        let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
        let genre = new Genre(1, 'horror')
        movie.genreList.add(genre)
        movie.save()

        let userMovie = new UserMovie(1, user, movie, false, 5)
        await userMovie.save()

        let movie2 = new Movie(2, 'random_id2', 'random movie 2', 1338, 'random movie image.jpg')
        let genre2 = new Genre(2, 'Sci-Fi')
        movie2.genreList.add(genre2)
        movie2.save()

        let userMovie2 = new UserMovie(2, user, movie2, false, 5)
        await userMovie2.save()

        replies = await telegraf.sendMessage('rand sci-fi')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(1)
        expect(replies.text).toEqual(
            expect.arrayContaining(['random movie 2'])
        )
    }
)

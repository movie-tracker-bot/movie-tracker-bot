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
            'Interstelar 2 Operation Terra 2040',
            'Interstellar',
            'Interstellar Wars',
            'Interested In',
            'Inside Interstellar',
            'Interstelar 3 Zero X',
            'Lolita From Interstellar Space',
            'Transformers Interstellar',
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
            expect.arrayContaining(['Random Movie'])
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
            expect.arrayContaining(['Random Movie 2'])
        )
    }
)


test(
    'test list endpoint pattern',
    () => {
        const { pattern } = bot.handlers.list

        const shouldMatch = [
            'list all',
            '   list watched',
            '   list  unwatched ',
            'list all horror',
            '   list watched sci-fi',
            '   list unwatched   drama',
        ]

        const shouldNotMatch = [
            'list',
            '  list',
        ]

        for (let input of shouldMatch) {
            console.log(input)
            expect(pattern.test(input)).toBeTruthy()
        }

        for (let input of shouldNotMatch) {
            expect(pattern.test(input)).toBeFalsy()
        }
    }
)


test(
    'test list',
    async () => {
        let replies = await telegraf.sendMessage('list all')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text.length).toEqual(1)

        let user = new User(0, 'random user')
        user.save()

        let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
        movie.save()

        let userMovie = new UserMovie(1, user, movie, false, 5)
        await userMovie.save()

        let movie2 = new Movie(2, 'random_id2', 'random movie 2', 1338, 'random movie image.jpg')
        movie2.save()

        let userMovie2 = new UserMovie(2, user, movie2, true, 5)
        await userMovie2.save()

        replies = await telegraf.sendMessage('list all')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(
            [
                '🎞 Random Movie\n✔ Random Movie 2\n'
            ]
        )

        replies = await telegraf.sendMessage('list watched')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(
            [
                '✔ Random Movie 2\n'
            ]
        )

        replies = await telegraf.sendMessage('list unwatched')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(
            [
                '🎞 Random Movie\n'
            ]
        )
    }
)


test(
    'test list genre',
    async () => {
        let replies = await telegraf.sendMessage('list all')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text.length).toEqual(1)

        let user = new User(0, 'random user')
        user.save()

        let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
        let genre = new Genre(1, 'Horror')
        movie.genreList.add(genre)
        movie.save()

        let userMovie = new UserMovie(1, user, movie, false, 5)
        await userMovie.save()

        let movie2 = new Movie(2, 'random_id2', 'random movie 2', 1338, 'random movie image.jpg')
        let genre2 = new Genre(2, 'Sci-Fi')
        movie2.genreList.add(genre2)
        movie2.save()

        let userMovie2 = new UserMovie(2, user, movie2, true, 5)
        await userMovie2.save()

        replies = await telegraf.sendMessage('list all')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(
            [
                '🎞 Random Movie\n✔ Random Movie 2\n'
            ]
        )

        replies = await telegraf.sendMessage('list all sci-fi')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(
            [
                '✔ Random Movie 2\n'
            ]
        )

        replies = await telegraf.sendMessage('list all horror')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(
            [
                '🎞 Random Movie\n'
            ]
        )
    }
)

test('test list scored', async () => {
    let replies = await telegraf.sendMessage('list all')

    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(replies.text.length).toEqual(1)

    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    let genre = new Genre(1, 'Horror')
    movie.genreList.add(genre)
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, 5)
    await userMovie.save()

    let movie2 = new Movie(2, 'random_id2', 'random movie 2', 1338, 'random movie image.jpg')
    let genre2 = new Genre(2, 'Sci-Fi')
    movie2.genreList.add(genre2)
    movie2.save()

    let userMovie2 = new UserMovie(2, user, movie2, true, null)
    await userMovie2.save()

    replies = await telegraf.sendMessage('list all')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(
        [
            '🎞 Random Movie\n✔ Random Movie 2\n'
        ]
    )

    replies = await telegraf.sendMessage('list scored')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(
        [
            '🎞 Random Movie - Your score: 5\n'
        ]
    )

    replies = await telegraf.sendMessage('list scored sci-fi')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text.length).toEqual(1)

    replies = await telegraf.sendMessage('list scored horror')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(
        [
            '🎞 Random Movie - Your score: 5\n'
        ]
    )
}
)

test(
    'test invalid list command',
    async () => {
        let replies = await telegraf.sendMessage('list all')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text.length).toEqual(1)

        replies = await telegraf.sendMessage('list al')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(['Sorry, I don\'t understand.'])

        replies = await telegraf.sendMessage('list all horror sci-fi')

        expect(replies.markdown).toEqual([])
        expect(replies.photos).toEqual([])
        expect(replies.text).toEqual(['Sorry, I don\'t understand.'])
    }
)

test(
    'test set movie as watched',
    async () => {
        let replies = await telegraf.sendMessage('list all')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text.length).toEqual(1)

        let user = new User(0, 'random user')
        user.save()

        let movie = new Movie(1, 'random_id', 'Random Movie', 1337, 'random movie image.jpg')
        let genre = new Genre(1, 'Horror')
        movie.genreList.add(genre)
        movie.save()

        let userMovie = new UserMovie(1, user, movie, false, 5)
        await userMovie.save()
        replies = await telegraf.sendMessage('watched random movie')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text[1]).toEqual('Do you want to set this movie as watched?')

        replies = await telegraf.sendMessage('nah')
        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text).toEqual(['Ok! Random Movie will remain unwatched'])

    }
)

test(
    'test cancel set movie as watched',
    async () => {
        let replies = await telegraf.sendMessage('list all')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text.length).toEqual(1)

        let user = new User(0, 'random user')
        user.save()

        let movie = new Movie(1, 'random_id', 'Random Movie', 1337, 'random movie image.jpg')
        let genre = new Genre(1, 'Horror')
        movie.genreList.add(genre)
        movie.save()

        let userMovie = new UserMovie(1, user, movie, false, 5)
        await userMovie.save()
        replies = await telegraf.sendMessage('watched random movie')

        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text[1]).toEqual('Do you want to set this movie as watched?')

        replies = await telegraf.sendMessage('nvm')
        expect(replies.markdown).toEqual([])
        expect(replies.photos.length).toEqual(0)
        expect(replies.text).toEqual(['Cancelling...'])

    }
)

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

class ContextMock {
    constructor(id, match, text = null) {
        this.from = { id: id }
        this.match = match
        this.message = { text: text }
        this.replies = []
        this.photos = []
    }
    async reply(string) {
        this.replies.push(string)
    }
    async replyWithPhoto(string) {
        this.photos.push(string)
    }
}

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
    bot.state = {}
})

test('test start message', async () => {
    const replies = await telegraf.sendStart()

    expect(replies.markdown.length).not.toEqual(0)
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual([])

    expect(Movie.saved.length).toEqual(0)
}
)

test('test help message', async () => {
    const replies = await telegraf.sendMessage('help')
    expect(replies.text.length).toEqual(1)
    expect(replies.text[0]).toEqual('Oh, I see you don\'t know what to do, let me review some comands for you:\n        /add + movie name -> to add a new movie in your list.\n        /remove + movie name -> to remove  a movie in your list.\n        /score + movie name + score -> to rate a movie\n        /watched + movie name -> to set a movie as watched\n        /list + (all|watched|unwatched|scored) + genre to list your movies\n        /rand to get a random recommendation\n        /myRank to see your rank')
}
)

test('test add endpoint pattern', () => {
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

test('test add movie', async () => {
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

test('test cancel add movie', async () => {
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

test('test fail to add movie', async () => {
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
        'Inside \'interstellar\'',
        'Interstelar 3: Zero X',
        'Lolita From Interstellar Space',
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

test('test add movie with addUnlisted', async () => {
    let user = new User(0, 'random user')
    user.save()
    bot.state[user.telegram_id] = {
        movieName: 'pulp fiction',
        addUnlisted: true
    }
    let ctx = new ContextMock(user.telegram_id, [])
    await bot.addMovie(ctx, (ctx, state) => { ctx.wasCalled = true })
    ctx = new ContextMock(user.telegram_id, [], 'yes')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies.length).toEqual(1)
    expect(ctx.wasCalled).toEqual(true)
})

test('test rand endpoint pattern', () => {
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


test('test rand movie', async () => {
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


test('test rand movie genre', async () => {
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


test('test list endpoint pattern', () => {
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


test('test list', async () => {
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
            '🎞 Random Movie (1337)\n✔ Random Movie 2 (1338)\n'
        ]
    )

    replies = await telegraf.sendMessage('list watched')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(
        [
            '✔ Random Movie 2 (1338)\n'
        ]
    )

    replies = await telegraf.sendMessage('list unwatched')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(
        [
            '🎞 Random Movie (1337)\n'
        ]
    )
}
)


test('test list genre', async () => {
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
            '🎞 Random Movie (1337)\n✔ Random Movie 2 (1338)\n'
        ]
    )

    replies = await telegraf.sendMessage('list all sci-fi')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(
        [
            '✔ Random Movie 2 (1338)\n'
        ]
    )

    replies = await telegraf.sendMessage('list all horror')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(['🎞 Random Movie (1337)\n'])
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
            '🎞 Random Movie (1337)\n✔ Random Movie 2 (1338)\n'
        ]
    )

    replies = await telegraf.sendMessage('list scored')

    expect(replies.markdown).toEqual([])
    expect(replies.photos).toEqual([])
    expect(replies.text).toEqual(
        [
            '🎞 Random Movie (1337) - Your score: 5\n'
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
            '🎞 Random Movie (1337) - Your score: 5\n'
        ]
    )
}
)

test('test invalid list command', async () => {
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

test('set movie as watched without name', async () => {
    let user = new User(0, 'random user')
    await user.save()
    let replies = await telegraf.sendMessage('/watched  ')
    expect(replies.markdown).toEqual([])
    expect(replies.text).toEqual(['To set a movie as watched, you must inform it\'s name'])
}
)

test('test set movie as watched', async () => {

    let user = new User(0, 'random user')
    await user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    let genre = new Genre(1, 'Horror')
    movie.genreList.add(genre)
    await movie.save()

    let userMovie = new UserMovie(1, user, movie, false, 5)
    await userMovie.save()
    let replies = await telegraf.sendMessage('watched random movie')

    expect(replies.markdown).toEqual([])
    expect(replies.text).toEqual([])
    expect(bot.state[user.telegram_id].movieName).toEqual(movie.title)
}
)

test('test set movie as watched with name and year', async () => {

    let user = new User(0, 'random user')
    await user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    let genre = new Genre(1, 'Horror')
    movie.genreList.add(genre)
    await movie.save()

    let userMovie = new UserMovie(1, user, movie, false, 5)
    await userMovie.save()
    let replies = await telegraf.sendMessage('watched random movie (1337)')

    expect(replies.markdown).toEqual([])
    expect(replies.text).toEqual([])
    expect(bot.state[user.telegram_id].movieName).toEqual(movie.title)
    expect(bot.state[user.telegram_id].movieYear).toEqual(movie.year)
}
)

test('set movie as watched with previous action still ongoing', async () => {
    let user = new User(0, 'random user')
    const next = async () => { return }
    bot.state[user.telegram_id] = {
        next: next
    }
    let replies = await telegraf.sendMessage('/watched random movie')
    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(replies.text.length).toEqual(0)
})

test('set found movie as watched', async () => {
    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()
    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie
    }

    await bot.setFoundMovieAsWatched(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Do you want to set this movie as watched?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'yes')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['The movie Random Movie is now set as watched!'])
}
)

test('cancel set found movie as watched', async () => {
    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()
    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie
    }

    await bot.setFoundMovieAsWatched(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Do you want to set this movie as watched?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'no')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Ok! Random Movie will remain unwatched'])

    ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie
    }

    await bot.setFoundMovieAsWatched(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Do you want to set this movie as watched?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'nvm')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Cancelling...'])
}
)

test('score movie without score', async () => {

    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let replies = await telegraf.sendMessage('/score random movie')

    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(replies.text).toEqual(['To add score please send movie name + score'])
})

test('score movie with score greater than 10', async () => {

    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let replies = await telegraf.sendMessage('/score random movie 15')

    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(replies.text).toEqual(['The score need to be between 0 and 10'])
})

test('score movie', async () => {

    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let replies = await telegraf.sendMessage('/score random movie 5')

    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(bot.state[user.telegram_id].movieName).toEqual(movie.title)
})

test('score movie with year', async () => {

    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let replies = await telegraf.sendMessage('/score random movie (1337) 5')

    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(bot.state[user.telegram_id].movieName).toEqual(movie.title)
    expect(bot.state[user.telegram_id].movieYear).toEqual(movie.year)
})

test('set score with previous action still ongoing', async () => {
    let user = new User(0, 'random user')
    const next = async () => { return }
    bot.state[user.telegram_id] = {
        next: next
    }
    let replies = await telegraf.sendMessage('score random movie 5')
    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(replies.text.length).toEqual(0)
})

test('test set score from movie', async () => {

    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()
    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie,
        score: 5
    }
    await bot.setScoreForMovie(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Do you want to set this movie\'s score to 5?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'yes')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Saved score 5 for Random Movie'])

    ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie,
        score: 5
    }
    await bot.setScoreForMovie(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Do you want to set this movie\'s score to 5?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'no')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Ok! This score won\'t be set to Random Movie'])

    ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie,
        score: 5
    }
    await bot.setScoreForMovie(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Do you want to set this movie\'s score to 5?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'nvm')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Cancelling...'])
}
)

test('test get movie with movie not on list', async () => {

    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movieName: 'rando movie',
        score: 5
    }
    await bot.getMovie(ctx, bot.setScoreForMovie.bind(bot))
    expect(ctx.replies).toEqual(['This movie isn\'t on your list, try adding it with the /add command'])

})

test('test get movie with movie not on list and addUnlisted', async () => {

    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movieName: 'pulp fiction',
        addUnlisted: true
    }
    await bot.getMovie(ctx, bot.setScoreForMovie.bind(bot))
    expect(ctx.replies[0]).toEqual('This movie isn\'t on your list, I will first /add pulp fiction')

})

test('test get movie with movie on list', async () => {

    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movieName: 'random movie',
        score: 5
    }
    await bot.getMovie(ctx, (ctx, state) => { return })
    expect(ctx.replies).toEqual([])
    expect(bot.state[user.telegram_id].movie.title).toEqual(movie.title)
    expect(bot.state[user.telegram_id].movie.id).toEqual(movie.id)


})

test('test get movie with multiple matches movies on list', async () => {

    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()
    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let movie2 = new Movie(2, 'random_id', 'random movie', 1338, 'random movie image2.jpg')
    movie2.save()
    let userMovie2 = new UserMovie(1, user, movie2, false, null)
    userMovie2.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movieName: 'random movie',
        score: 5
    }
    await bot.getMovie(ctx, (ctx, state) => { return })
    expect(ctx.replies).toEqual(['Random Movie', 'Is this the correct movie?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])

    ctx = new ContextMock(user.telegram_id, [], 'no')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Random Movie', 'Is this the correct movie?'])
    expect(ctx.photos).toEqual(['random movie image2.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'no')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Well, I ain\'t got any other suggestions...'])

    ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movieName: 'random movie',
        score: 5
    }
    await bot.getMovie(ctx, (ctx, state) => { return })
    expect(ctx.replies).toEqual(['Random Movie', 'Is this the correct movie?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'yes')
    await bot.state[user.telegram_id].next(ctx)

    expect(ctx.replies).toEqual([])
    bot.state[user.telegram_id] = {
        movieName: 'random movie',
        score: 5
    }
    await bot.getMovie(ctx, (ctx, state) => { return })
    expect(ctx.replies).toEqual(['Random Movie', 'Is this the correct movie?'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'nvm')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Cancelling...'])
})

test('test get movie with year', async () => {

    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()
    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let movie2 = new Movie(2, 'random_id', 'random movie', 1338, 'random movie image2.jpg')
    movie2.save()
    let userMovie2 = new UserMovie(1, user, movie2, false, null)
    userMovie2.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movieName: 'random movie',
        movieYear: 1337,
        score: 5
    }
    await bot.getMovie(ctx, (ctx, state) => { return })
    expect(ctx.replies).toEqual([])
    expect(bot.state[user.telegram_id].movie.title).toEqual(movie.title)
    expect(bot.state[user.telegram_id].movie.id).toEqual(movie.id)
})

test('wait previous action', async () => {
    let user = new User(0, 'random user')
    const next = async () => { return }
    user.save()
    let result = await bot.endPreviousAction(user.telegram_id, next)
    expect(result).toEqual(false)
    bot.state[user.telegram_id] = {
        next: next
    }
    result = await bot.endPreviousAction(user.telegram_id, next)
    expect(result).toEqual(true)

})

test('remove movie without name',
    async () => {
        let user = new User(0, 'random user')
        user.save()

        let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
        let genre = new Genre(1, 'Horror')
        movie.genreList.add(genre)
        movie.save()

        let userMovie = new UserMovie(1, user, movie, false, 5)
        await userMovie.save()
        let replies = await telegraf.sendMessage('/remove  ')
        expect(replies.markdown).toEqual([])
        expect(replies.text[0]).toEqual('To remove a movie, you must inform the name')
    })

test('remove movie with name', async () => {
    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    let genre = new Genre(1, 'Horror')
    movie.genreList.add(genre)
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, 5)
    await userMovie.save()
    let replies = await telegraf.sendMessage('/remove random movie')
    expect(replies.markdown).toEqual([])
    expect(replies.text).toEqual([])
    expect(bot.state[user.telegram_id].movieName).toEqual(movie.title)
})

test('remove movie with name and year', async () => {
    let user = new User(0, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    let genre = new Genre(1, 'Horror')
    movie.genreList.add(genre)
    movie.save()

    let userMovie = new UserMovie(1, user, movie, false, 5)
    await userMovie.save()
    let replies = await telegraf.sendMessage('/remove random movie (1337)')
    expect(replies.markdown).toEqual([])
    expect(replies.text).toEqual([])
    expect(bot.state[user.telegram_id].movieName).toEqual(movie.title)
    expect(bot.state[user.telegram_id].movieYear).toEqual(movie.year)
})

test('remove movie with previous action still ongoing', async () => {
    let user = new User(0, 'random user')
    const next = async () => { return }
    bot.state[user.telegram_id] = {
        next: next
    }
    let replies = await telegraf.sendMessage('/remove random movie')
    expect(replies.markdown).toEqual([])
    expect(replies.photos.length).toEqual(0)
    expect(replies.text.length).toEqual(0)
})

test('remove found movie', async () => {
    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()
    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie
    }

    await bot.removeFoundMovie(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Are you sure you want to remove this movie from your list? This action can\'t be undone'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'yes')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['The movie Random Movie was removed from your list!'])
})

test('cancel remove found movie', async () => {
    let user = new User(12, 'random user')
    user.save()

    let movie = new Movie(1, 'random_id', 'random movie', 1337, 'random movie image.jpg')
    movie.save()
    let userMovie = new UserMovie(1, user, movie, false, null)
    userMovie.save()
    let ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie
    }

    await bot.removeFoundMovie(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Are you sure you want to remove this movie from your list? This action can\'t be undone'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'no')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Ok! Random Movie will remain on your list'])

    ctx = new ContextMock(user.telegram_id, [])
    bot.state[user.telegram_id] = {
        movie: movie
    }

    await bot.removeFoundMovie(ctx, bot.state[user.telegram_id])
    expect(ctx.replies).toEqual(['Random Movie', 'Are you sure you want to remove this movie from your list? This action can\'t be undone'])
    expect(ctx.photos).toEqual(['random movie image.jpg'])
    ctx = new ContextMock(user.telegram_id, [], 'nvm')
    await bot.state[user.telegram_id].next(ctx)
    expect(ctx.replies).toEqual(['Cancelling...'])
})

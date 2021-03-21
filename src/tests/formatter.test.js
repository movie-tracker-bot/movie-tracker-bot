const Formatter = require('../helpers/formatter')

test(
    'test getMovieId',
    async () => {
        const id = Formatter.getMovieId('/title/tt0816692/');
        expect(id).toEqual('tt0816692')
    }
)

describe('Get Medal in Rank', function () {
    it('Medal for first place', async function () {
        const data = Formatter.getMedals(Number(1))
        expect(data).toEqual('🥇')
    })
    it('Medal for second place', async function () {
        const data = Formatter.getMedals(Number(2))
        expect(data).toEqual('🥈')
    })
    it('Medal for third place', async function () {
        const data = Formatter.getMedals(Number(3))
        expect(data).toEqual('🥉')
    })
    it('Medal for invalid place', async function () {
        const data = Formatter.getMedals(null)
        expect(data).toEqual(undefined)
    })
})

describe('test Title Case', function () {
    it('Test with a valid string', async function () {
        const data = Formatter.toTitleCase('lua nova')
        expect(data).toEqual('Lua Nova')
    })

    it('Test with a invalid string', async function () {
        const data = Formatter.toTitleCase(null)
        expect(data).toEqual(undefined)
    })

})

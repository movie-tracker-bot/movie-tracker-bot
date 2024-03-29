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

describe('Test Remove Accents And Lower Case Funciontion', function () {
    it('Test with valid string', async function () {
        const data = Formatter.removeAccentsAndLowerCase('A última música')
        expect(data).toEqual('a ultima musica')
    })
    it('Test with a invalid string', async function () {
        const data = Formatter.removeAccentsAndLowerCase(null)
        expect(data).toEqual('')
    })
    it('Test with a Number', async function () {
        const data = Formatter.removeAccentsAndLowerCase(Number(33))
        expect(data).toEqual('33')
    })

})


describe('Test Remove Score', function () {
    it('Test with valid string', async function () {
        const data = Formatter.removeScore('A última música 33')
        expect(data).toEqual('A última música')
    })
    it('Test with a invalid string', async function () {
        const data = Formatter.removeAccentsAndLowerCase(null)
        expect(data).toEqual('')
    })

})

describe('Test Get Number Of String', function () {
    it('Test with valid string', async function () {
        const data = Formatter.getNumberOfString('A musica 33')
        expect(data).toEqual(Number(33))
    })
    it('Test with a string only numbers', async function () {
        const data = Formatter.getNumberOfString('48')
        expect(data).toEqual(Number(48))
    })
    it('Test with a number', async function () {
        const data = Formatter.getNumberOfString(Number(48))
        expect(data).toEqual(null)
    })
    it('Test with a string without number', async function () {
        const data = Formatter.getNumberOfString('A ultima musica')
        expect(data).toEqual(null)
    })
})

describe('Test Remove Year', function () {
    it('Test with valid string', async function () {
        const data = Formatter.removeYear('halloween (1978)')
        expect(data).toEqual('halloween')
    })
    it('Test with a invalid string', async function () {
        const data = Formatter.removeAccentsAndLowerCase('halloween')
        expect(data).toEqual('halloween')
    })

})

describe('Test Get Year', function () {
    it('Test with valid string', async function () {
        const data = Formatter.getYear('halloween (1978)')
        expect(data).toEqual(Number(1978))
    })
    it('Test with a string only numbers', async function () {
        const data = Formatter.getYear('(1948)')
        expect(data).toEqual(Number(1948))
    })
    it('Test with a string without parentesis', async function () {
        const data = Formatter.getYear('halloween 1978')
        expect(data).toEqual(null)
    })
    it('Test with a string without four digits', async function () {
        const data = Formatter.getYear('halloween (12)')
        expect(data).toEqual(null)
    })
    it('Test with a string without number', async function () {
        const data = Formatter.getYear('A ultima musica')
        expect(data).toEqual(null)
    })
})
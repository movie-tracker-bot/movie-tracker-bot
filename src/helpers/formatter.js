const _ = require('lodash')
class Formatter {

    static removeAccentsAndLowerCase(value) {
        if (!value) {
            return ''
        }

        if (typeof value !== 'string') {
            value = String(value)
        }

        return _.deburr(_.toLower(_.trim(value)))
    }

    static getNumberOfString(str) {
        if (!str || typeof str !== 'string') {
            return null
        }
        str = str.replace(/\D/g, '')
        if (str.length <= 0) {
            return null
        }
        return Number(str)
    }

    static getMedals(number) {
        switch (number) {
            case 1:
                return '🥇'
            case 2:
                return '🥈'
            case 3:
                return '🥉'
        }
    }

    static getMovieId(idString) {
        let regex = new RegExp('/title/(tt[0-9]+)/')
        return regex.exec(idString)[1]
    }

    static toTitleCase(string){
        return _.startCase(_.camelCase(string))
    }
}
module.exports = Formatter

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

}
module.exports = Formatter

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

}
module.exports = Formatter

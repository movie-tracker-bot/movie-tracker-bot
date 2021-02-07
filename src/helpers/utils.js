const stringSimilarity = require('string-similarity')
const Formatter = require('./formatter')

class Util {

    static getParity(str1, str2) {
        str1 = Formatter.removeAccentsAndLowerCase(str1)
        str2 = Formatter.removeAccentsAndLowerCase(str2)

        const parity = stringSimilarity.compareTwoStrings(str1, str2).toFixed(2)
        return parity
    }

}
module.exports = Util

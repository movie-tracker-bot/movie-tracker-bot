const Formatter = require('./formatter')

class Util {
    static StringEqualsIgnoreCase(str1, str2) {
        let comparison = str1.localeCompare(
            str2,
            undefined,
            { sensitivity: 'base' }
        )

        return comparison === 0
    }
}
module.exports = Util

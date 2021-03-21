class Util {
    static StringEqualsIgnoreCase(str1, str2) {
        const comparison = str1.localeCompare(str2, undefined, { sensitivity: 'base' })
        return comparison === 0
    }
}
module.exports = Util

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

    static removeScore(str) {
        let score = Formatter.getNumberOfString(str)
        score = String(score)
        var n = str.toLowerCase().lastIndexOf(score)
        str = str.slice(0, n)
        return _.trim(str)
    }

    static removeYear(string) {
        let year = Formatter.getYear(string)
        year = `(${year})`
        var n = string.toLowerCase().lastIndexOf(year)
        string = string.slice(0, n)
        return _.trim(string)
    }

    static getNumberOfString(str) {
        if (!str || typeof str !== 'string') {
            return null
        }

        var n = Formatter.lastRegexIndexOf(str, /[0-9.]+/g)
        if (n < 0) {
            return null
        }
        str = str.slice(n)
        return Number(str)
    }

    static lastRegexIndexOf(str, re) {
        var lastIndex = -2
        for (let i = 0; i < str.length; i++) {
            let thisIndex = Formatter.regexIndexOf(str, re, i)
            if (thisIndex - 1 > lastIndex) {
                lastIndex = thisIndex
            }
        }
        return lastIndex
    }
    static regexIndexOf(str, re, i) {
        var indexInSuffix = str.slice(i).search(re)
        if (indexInSuffix < 0) {
            return -1
        }
        return indexInSuffix + i
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

    static toTitleCase(string) {
        if (typeof string !== 'string') {
            return undefined
        }
        return string.split(' ')
            .map(_.capitalize)
            .join(' ')
    }

    static getYear(string) {
        const index = string.search(/[(][0-9][0-9][0-9][0-9][)]/g)
        if (index < 0) {
            return null
        }
        let year = string.slice(index + 1, index + 5)
        return Number(year)
    }
}
module.exports = Formatter

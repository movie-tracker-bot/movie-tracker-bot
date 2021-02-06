/* eslint-disable indent */
const Formatter = require('../helpers/formatter')

class MovieHandler {

  /**
*
* @param {string} id
* @param {string} movieName
*/
  async add() {

  }

  /**
*
* @param {string} id
* @param {string} movieName
*/
  async remove() {

  }


  /**
*
* @param {string} id
* @param {string} movieName
* @param {Number} score
*/
  async setScore(ctx) {
    const id = ctx.from.id
    const movieName = Formatter.removeAccentsAndLowerCase(ctx.match[1])
    const score = Number(ctx.match[2])

    console.log(`Add Score: ${score} to ${movieName}`)

  }

  /**
*
* @param {string} id
*/
  async list() {

  }

  /**
*
* @param {string} id
*/
  async rank() {

  }

  /**
*
* @param {string} id
*/
  async rand() {

  }

}

module.exports = MovieHandler

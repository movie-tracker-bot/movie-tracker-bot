const Formatter = require("./formatter")

class Menssages {

    static welcomeMessage() {
        return `Welcome to the movie tracker! Here you can manage your movie list and get recommendations for movies. These are all available commands:
        /add + movie name to add to your list.
        /remove + movie name to remove  a movie in your list.
        /score + movie name + score to rate a movie
        /list to see all your movies
        /rand to get a random recommendation
        /myRank to see your rank `
    }

    static rankMovieMessage(movies) {
        let message = 'My Rank:\n'
        let limit = Math.min(movies.length, 3)
        for (let i = 0; i < limit; i++) {
            message += `${Formatter.getMedals(i + 1)} ${movies[i].title} - ${movies[i].score}\n`
        }
        return message
    }
}
module.exports = Menssages

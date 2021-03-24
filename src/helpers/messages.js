const Formatter = require('./formatter')

class Menssages {
    static welcomeMessage() {
        return `Welcome to the movie tracker! Here you can manage your movie list and get recommendations for movies. These are all available commands:
        /add + movie name to add to your list.
        /remove + movie name to remove  a movie in your list.
        /score + movie name + score to rate a movie
        /watched + movie name to set a movie as watched
        /list + (all|watched|unwatched|scored) + genre to list your movies
        /rand to get a random recommendation
        /myRank to see your rank`
    }

    static helpMessage() {
        return `Oh, I see you don't know what to do, let me review some comands for you:
        /add + movie name -> to add a new movie in your list.
        /remove + movie name -> to remove  a movie in your list.
        /score + movie name + score -> to rate a movie
        /watched + movie name -> to set a movie as watched
        /list + (all|watched|unwatched|scored) + genre to list your movies
        /rand to get a random recommendation
        /myRank to see your rank`
    }


    static rankMovieMessage(movies) {
        let message = 'My Rank:\n'
        let limit = Math.min(movies.length, 3)
        for (let i = 0; i < limit; i++) {
            message += `${Formatter.getMedals(i + 1)} ${Formatter.toTitleCase(movies[i].title)} - ${movies[i].score}\n`
        }
        return message
    }
}
module.exports = Menssages

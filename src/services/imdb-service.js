const axios = require('axios')

class ImdbService {
    static async getMovieByTitle(title) {
        try {
            let response = await axios.get('https://imdb8.p.rapidapi.com/title/find', {
                params: {
                    q: title
                },
                timeout: 5000,
                headers: {
                    'x-rapidapi-key': '73c8548501mshc421236698fb7a2p1d9497jsndc5877340195',
                    'x-rapidapi-host': 'imdb8.p.rapidapi.com'
                }
            })
            return response.data.results.filter( // Remove movies with empty title.
                movie => movie.title
            )
        } catch (err) {
            console.log('Erro ao recuperar o nome do filme')
            return null
        }
    }

    static async getMovieDetails(id) {
        try {
            let response = await axios.get('https://imdb8.p.rapidapi.com/title/get-details', {
                params: {
                    tconst: id
                },
                timeout: 5000,
                headers: {
                    'x-rapidapi-key': '73c8548501mshc421236698fb7a2p1d9497jsndc5877340195',
                    'x-rapidapi-host': 'imdb8.p.rapidapi.com'
                }
            })
            return response.data.results
        } catch (err) {
            console.log('Erro ao recuperar os dados detalhados do filme')
            return null
        }
    }

    static async getMovieGenres(id) {
        try {
            let response = await axios.get('https://imdb8.p.rapidapi.com/title/get-genres', {
                params: {
                    tconst: id
                },
                timeout: 5000,
                headers: {
                    'x-rapidapi-key': '73c8548501mshc421236698fb7a2p1d9497jsndc5877340195',
                    'x-rapidapi-host': 'imdb8.p.rapidapi.com'
                }
            })
            return response.data
        } catch (err) {
            console.log('Erro ao recuperar os dados detalhados do filme')
            return null
        }
    }
}

module.exports = ImdbService

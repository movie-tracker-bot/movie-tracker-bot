class Menssages {

    static welcomeMessage() {
        return `Bem vindo ao movie tracker, O melhor assistente de filmes do telegram!\n 
        Aqui você poderá gerenciar sua lista de filmes que quer assistir, obter recomendações que melhor se adequa ao seu gosto.\n 
        Escolha um dos comandos abaixo:\n
            /add + nome do filme para adiciona-lo a sua lista.\n
            /remove + nome do filme para remove-lo.\n
            /score + nome do filme + avaliação.\n
            /list para ver todos os filmes salvos.
            /rand para obter uma recomendação.\n
            /myRank para visualizar seu rank de avaliações.\n`
    }
}
module.exports = Menssages

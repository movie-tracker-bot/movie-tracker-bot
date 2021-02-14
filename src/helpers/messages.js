class Menssages {

    static welcomeMessage() {
        return `Bem vindo ao movie tracker! Aqui você poderá gerenciar sua lista de filmes que quer assistir, obter recomendações que melhor se adequa ao seu gosto. Escolha um dos comandos abaixo:
        /add + nome do filme para adiciona-lo a sua lista.
        /remove + nome do filme para remove-lo.
        /score + nome do filme + avaliação.
        /list para ver todos os filmes salvos.
        /rand para obter uma recomendação.
        /myRank para visualizar seu rank de avaliações.`
    }
}
module.exports = Menssages

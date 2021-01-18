const sqlite3 = require('sqlite3').verbose();
const sqlite = require('sqlite');
class Database{
    /**
     * Retorna um objeto Database para fazer operações no banco de dados
     */
    static async getDatabase(){
        return await sqlite.open({ filename:'./database/movie_tracker_bot.db', driver: sqlite3.Database })
    }

    /**
    Cria as tabelas e configura o banco de dados, se ele ainda não foi configurado
     */
    static createTables(){
        const db = new sqlite3.Database('./database/movie_tracker_bot.db')
        db.serialize(()=>{
            db.run("PRAGMA foreign_keys = ON;",(err)=>{
                if (err){
                    console.log(err)
                    throw Error("An error occurred while activating foreign keys")
                }
            })
            .run(`CREATE TABLE IF NOT EXISTS user(
                    telegram_id INTEGER PRIMARY KEY, 
                    first_name TEXT NOT NULL);`,
            (err)=>{
                if (err){
                    console.log(err)
                    throw Error("An error occurred while creating the 'user' table")
                }
            })
            .run(`CREATE TABLE IF NOT EXISTS genre(
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL);`,
            (err)=>{
                if (err){
                    console.log(err)
                    throw Error("An error occurred while creating the 'genre' table")
                }
            })
            .run(`CREATE TABLE IF NOT EXISTS movie(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                imdb_id TEXT UNIQUE,
                title TEXT NOT NULL,
                year INTEGER,
                poster_url TEXT);`,
            (err)=>{
                if (err){
                    console.log(err)
                    throw Error("An error occurred while creating the 'movie' table")
                }
            })
            .run(`CREATE TABLE IF NOT EXISTS movie_genre(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                movie_id INTEGER REFERENCES movie(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                genre_id INTEGER REFERENCES genre(id) ON DELETE RESTRICT ON UPDATE CASCADE);
                CREATE INDEX IF NOT EXISTS movie_genre_movie_id_fidx ON movie_genre(movie_id);
                CREATE INDEX IF NOT EXISTS movie_genre_genre_id_fidx ON movie_genre(genre_id);`,
            (err)=>{
                if (err){
                    console.log(err)
                    throw Error("An error occurred while creating the 'movie_genre' table")
                }
            })
            .run(`CREATE TABLE IF NOT EXISTS user_movie(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER REFERENCES user(telegram_id) ON DELETE CASCADE ON UPDATE CASCADE,
                movie_id INTEGER REFERENCES movie(id) ON DELETE RESTRICT ON UPDATE CASCADE,
                watched INTEGER DEFAULT 0 NOT NULL);
                CREATE INDEX IF NOT EXISTS user_movie_user_id_fidx ON user_movie(user_id);
                CREATE INDEX IF NOT EXISTS user_movie_movie_id_fidx ON user_movie(movie_id);`,
            (err)=>{
                if (err){
                    console.log(err)
                    throw Error("An error occurred while creating the 'user_movie' table")
                }
            })
        })     
    }
}
module.exports=Database
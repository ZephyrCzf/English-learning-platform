module.exports = {
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'english_learning',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  dialect: 'mysql',
  port: 3306,
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  dialectOptions: {
    charset: 'utf8mb4'
  }
}; 
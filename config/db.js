import 'dotenv/config';
import { Sequelize } from 'sequelize';

export default new Sequelize(process.env.DB_NAME || 'avaliacao_n3', process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    dialect: 'mysql',
    logging: false
});

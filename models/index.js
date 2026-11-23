import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const options = { freezeTableName: true, timestamps: false };

export const Tutor = db.define('tutor', {
    cpf: { type: DataTypes.CHAR(11), primaryKey: true },
    nome: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(150), allowNull: false }
}, options);

export const AlturaPet = db.define('altura_pet', {
    id_altura: { type: DataTypes.TINYINT.UNSIGNED, primaryKey: true },
    altura: { type: DataTypes.STRING(10), allowNull: false }
}, options);

export const Pet = db.define('pet', {
    codigo_pet: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    nome_pet: { type: DataTypes.STRING(100), allowNull: false },
    genero_pet: { type: DataTypes.STRING(30), allowNull: false },
    altura_cm: { type: DataTypes.DECIMAL(7, 2), allowNull: false },
    cpf_tutor: { type: DataTypes.CHAR(11), allowNull: false },
    id_altura: { type: DataTypes.TINYINT.UNSIGNED, allowNull: false }
}, options);

Tutor.hasMany(Pet, { foreignKey: 'cpf_tutor', as: 'pets' });
Pet.belongsTo(Tutor, { foreignKey: 'cpf_tutor', as: 'tutor' });
Pet.belongsTo(AlturaPet, { foreignKey: 'id_altura', as: 'classificacao' });

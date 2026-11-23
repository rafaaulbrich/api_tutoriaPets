import { QueryTypes } from 'sequelize';
import db from '../config/db.js';
import { cpf, inteiro } from './validacao.js';

export async function medidasPorTutor(req, res) {
    const dados = await db.query(`
        SELECT t.cpf, t.nome, COUNT(p.codigo_pet) AS total_pets,
            SUM(CASE WHEN a.altura = 'pequeno' THEN 1 ELSE 0 END) AS pequenos,
            SUM(CASE WHEN a.altura = 'média' THEN 1 ELSE 0 END) AS medios,
            SUM(CASE WHEN a.altura = 'alto' THEN 1 ELSE 0 END) AS altos
        FROM tutor t
        LEFT JOIN pet p ON p.cpf_tutor = t.cpf
        LEFT JOIN altura_pet a ON a.id_altura = p.id_altura
        GROUP BY t.cpf, t.nome
        ORDER BY total_pets DESC, t.cpf
    `, { type: QueryTypes.SELECT });

    res.json(dados);
}

export async function tutoresSemPets(req, res) {
    const dados = await db.query(`
        SELECT t.cpf, t.nome, t.email
        FROM tutor t
        WHERE NOT EXISTS (SELECT 1 FROM pet p WHERE p.cpf_tutor = t.cpf)
        ORDER BY t.nome, t.cpf
    `, { type: QueryTypes.SELECT });

    res.json(dados);
}

export async function petsAcimaDaMedia(req, res) {
    const dados = await db.query(`
        SELECT p.codigo_pet, p.nome_pet, t.nome AS tutor, p.altura_cm,
            ROUND(m.media_cm, 2) AS media_do_tutor
        FROM pet p
        JOIN tutor t ON t.cpf = p.cpf_tutor
        JOIN (
            SELECT cpf_tutor, AVG(altura_cm) AS media_cm
            FROM pet
            GROUP BY cpf_tutor
        ) m ON m.cpf_tutor = t.cpf
        WHERE p.altura_cm > m.media_cm
        ORDER BY t.cpf, p.altura_cm DESC, p.codigo_pet
    `, { type: QueryTypes.SELECT });

    res.json(dados);
}

export async function fichas(req, res) {
    res.json(await db.query('SELECT * FROM vw_ficha_pet ORDER BY codigo_pet', { type: QueryTypes.SELECT }));
}

export async function ocupacaoPortes(req, res) {
    res.json(await db.query('SELECT * FROM vw_ocupacao_portes ORDER BY id_altura', { type: QueryTypes.SELECT }));
}

export async function transferir(req, res) {
    const codigo = inteiro(req.params.codigo, 'codigo_pet');
    const cpfTutor = cpf(req.body?.cpf_tutor);
    const dados = await db.query('CALL sp_transferir_pet(:codigo, :cpfTutor)', {
        replacements: { codigo, cpfTutor }
    });

    res.json(dados[0]);
}

export async function perfilPorPorte(req, res) {
    const minimo = inteiro(req.query.minimo ?? 1, 'minimo');
    const dados = await db.query('CALL sp_perfil_por_porte(:minimo)', { replacements: { minimo } });

    res.json(dados);
}

import db from '../config/db.js';
import { Tutor } from '../models/index.js';
import { ErroHttp, cpf, texto } from './validacao.js';

function dadosTutor(body = {}) {
    const email = texto(body?.email, 'email', 150);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new ErroHttp(400, 'Informe um e-mail válido.');
    }

    return { cpf: cpf(body.cpf), nome: texto(body.nome, 'nome', 100), email };
}

export async function listar(req, res) {
    res.json(await Tutor.findAll({ order: [['nome', 'ASC'], ['cpf', 'ASC']] }));
}

export async function buscar(req, res) {
    const tutor = await Tutor.findByPk(cpf(req.params.cpf));

    if (!tutor) throw new ErroHttp(404, 'Tutor não encontrado.');

    res.json(tutor);
}

export async function criar(req, res) {
    const tutor = await Tutor.create(dadosTutor(req.body));

    res.status(201).location(`/tutores/${tutor.cpf}`).json(tutor);
}

export async function atualizar(req, res) {
    const identificador = cpf(req.params.cpf);
    const dados = dadosTutor({ ...req.body, cpf: req.body?.cpf ?? identificador });
    const tutor = await db.transaction(async (transaction) => {
        const atual = await Tutor.findByPk(identificador, { transaction, lock: transaction.LOCK.UPDATE });

        if (!atual) throw new ErroHttp(404, 'Tutor não encontrado.');

        await Tutor.update(dados, { where: { cpf: identificador }, transaction });

        return Tutor.findByPk(dados.cpf, { transaction });
    });

    res.json(tutor);
}

export async function excluir(req, res) {
    const removidos = await Tutor.destroy({ where: { cpf: cpf(req.params.cpf) } });

    if (!removidos) throw new ErroHttp(404, 'Tutor não encontrado.');
    
    res.sendStatus(204);
}

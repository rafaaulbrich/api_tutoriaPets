import db from '../config/db.js';
import { AlturaPet, Pet, Tutor } from '../models/index.js';
import { ErroHttp, altura, cpf, inteiro, texto } from './validacao.js';

const include = ['classificacao', 'tutor'];

function dadosPet(body) {
    return {
        nome_pet: texto(body?.nome_pet, 'nome_pet', 100),
        genero_pet: texto(body.genero_pet, 'genero_pet', 30),
        altura_cm: altura(body.altura_cm),
        cpf_tutor: cpf(body.cpf_tutor)
    };
}

export async function listar(req, res) {
    const where = {};

    if (req.query.cpf !== undefined) where.cpf_tutor = cpf(req.query.cpf);

    if (req.query.id_altura !== undefined) where.id_altura = inteiro(req.query.id_altura, 'id_altura', 3);

    res.json(await Pet.findAll({ where, include, order: [['codigo_pet', 'ASC']] }));
}

export async function listarDoTutor(req, res) {
    const cpfTutor = cpf(req.params.cpf);

    if (!await Tutor.findByPk(cpfTutor)) throw new ErroHttp(404, 'Tutor não encontrado.');

    res.json(await Pet.findAll({ where: { cpf_tutor: cpfTutor }, include, order: [['codigo_pet', 'ASC']] }));
}

export async function listarAlturas(req, res) {
    res.json(await AlturaPet.findAll({ order: [['id_altura', 'ASC']] }));
}

export async function buscar(req, res) {
    const pet = await Pet.findByPk(inteiro(req.params.codigo, 'codigo_pet'), { include });

    if (!pet) throw new ErroHttp(404, 'Pet não encontrado.');

    res.json(pet);
}

export async function criar(req, res) {
    const dados = dadosPet(req.body);
    const pet = await db.transaction(async (transaction) => {
        // O trigger substitui o valor inicial antes de validar a chave estrangeira.
        const novo = await Pet.create({ ...dados, id_altura: 1 }, { transaction });

        return Pet.findByPk(novo.codigo_pet, { include, transaction });
    });

    res.status(201).location(`/pets/${pet.codigo_pet}`).json(pet);
}

export async function atualizar(req, res) {
    const codigo = inteiro(req.params.codigo, 'codigo_pet');
    const dados = dadosPet(req.body);
    const pet = await db.transaction(async (transaction) => {
        const atual = await Pet.findByPk(codigo, { transaction, lock: transaction.LOCK.UPDATE });

        if (!atual) throw new ErroHttp(404, 'Pet não encontrado.');

        await Pet.update(dados, { where: { codigo_pet: codigo }, transaction });

        return Pet.findByPk(codigo, { include, transaction });
    });

    res.json(pet);
}

export async function excluir(req, res) {
    const removidos = await Pet.destroy({ where: { codigo_pet: inteiro(req.params.codigo, 'codigo_pet') } });

    if (!removidos) throw new ErroHttp(404, 'Pet não encontrado.');
    
    res.sendStatus(204);
}

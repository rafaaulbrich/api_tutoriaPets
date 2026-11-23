import { createHash, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { ErroHttp } from './validacao.js';

const emissor = 'avaliacao-n3';

function credencialConfere(recebida, esperada) {
    if (typeof recebida !== 'string') return false;

    const hash = (valor) => createHash('sha256').update(valor).digest();

    return timingSafeEqual(hash(recebida), hash(esperada));
}

export function login(req, res) {
    const { usuario, senha } = req.body ?? {};
    const usuarioConfere = credencialConfere(usuario, process.env.LOGIN_USUARIO);
    const senhaConfere = credencialConfere(senha, process.env.LOGIN_SENHA);

    if (!usuarioConfere || !senhaConfere) throw new ErroHttp(401, 'Credenciais inválidas.');

    const token = jwt.sign({}, process.env.JWT_SEGREDO, {
        algorithm: 'HS256', issuer: emissor, subject: usuario, expiresIn: '1h'
    });

    res.json({ token, tipo: 'Bearer', expira_em_segundos: 3600 });
}

export function exigirToken(req, res, next) {
    const token = req.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];

    try {
        jwt.verify(token, process.env.JWT_SEGREDO, {
            algorithms: ['HS256'], issuer: emissor, subject: process.env.LOGIN_USUARIO
        });
    } catch {
        throw new ErroHttp(401, 'Token Bearer ausente, inválido ou expirado.');
    }
    
    next();
}

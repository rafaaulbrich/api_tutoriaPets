import express from 'express';
import db from './config/db.js';
import tutorRoutes from './routes/tutorRoutes.js';
import petRoutes from './routes/petRoutes.js';
import relatorioRoutes from './routes/relatorioRoutes.js';
import { listarAlturas } from './controllers/petController.js';
import { login } from './controllers/authController.js';
import { ErroHttp } from './controllers/validacao.js';

for (const variavel of ['LOGIN_USUARIO', 'LOGIN_SENHA', 'JWT_SEGREDO']) {
    if (!process.env[variavel]?.trim()) throw new Error(`Configure ${variavel} no ambiente.`);
}

if (Buffer.byteLength(process.env.JWT_SEGREDO) < 32) {
    throw new Error('JWT_SEGREDO deve ter no mínimo 32 bytes.');
}

const app = express();
const porta = Number(process.env.PORT || 3000);

app.use(express.json({ limit: '16kb' }));
app.post('/login', login);
app.get('/alturas', listarAlturas);
app.use('/tutores', tutorRoutes);
app.use('/pets', petRoutes);
app.use('/relatorios', relatorioRoutes);
app.use((req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));
app.use((erro, req, res, next) => {
    if (res.headersSent) return next(erro);

    if (erro instanceof ErroHttp) return res.status(erro.status).json({ erro: erro.message });
    
    if (erro.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });

    if (erro.type === 'entity.too.large') return res.status(413).json({ erro: 'Corpo da requisição muito grande.' });

    const causa = erro.original;
    
    if (causa?.code === 'ER_DUP_ENTRY') return res.status(409).json({ erro: 'CPF já cadastrado.' });

    if (['ER_NO_REFERENCED_ROW', 'ER_NO_REFERENCED_ROW_2'].includes(causa?.code)) {
        return res.status(404).json({ erro: 'Tutor não encontrado.' });
    }

    if (['ER_ROW_IS_REFERENCED', 'ER_ROW_IS_REFERENCED_2'].includes(causa?.code)) {
        return res.status(409).json({ erro: 'Transfira ou remova os pets deste tutor antes de excluí-lo.' });
    }
    
    if (causa?.sqlState === '45000') return res.status(404).json({ erro: causa.sqlMessage });

    console.error(erro);
    res.status(500).json({ erro: 'Erro interno do servidor.' });
});

await db.authenticate();
app.listen(porta, () => console.log(`Servidor disponível em http://localhost:${porta}`));

import { Router } from 'express';
import * as relatorio from '../controllers/bancoController.js';

const router = Router();

router.get('/medidas-por-tutor', relatorio.medidasPorTutor);
router.get('/tutores-sem-pets', relatorio.tutoresSemPets);
router.get('/pets-acima-da-media', relatorio.petsAcimaDaMedia);
router.get('/fichas', relatorio.fichas);
router.get('/ocupacao-portes', relatorio.ocupacaoPortes);
router.get('/perfil-por-porte', relatorio.perfilPorPorte);

export default router;

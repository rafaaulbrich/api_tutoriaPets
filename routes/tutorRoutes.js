import { Router } from 'express';
import * as tutor from '../controllers/tutorController.js';
import { listarDoTutor } from '../controllers/petController.js';

const router = Router();

router.get('/', tutor.listar);
router.post('/', tutor.criar);
router.get('/:cpf/pets', listarDoTutor);
router.get('/:cpf', tutor.buscar);
router.put('/:cpf', tutor.atualizar);
router.delete('/:cpf', tutor.excluir);

export default router;

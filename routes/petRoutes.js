import { Router } from 'express';
import * as pet from '../controllers/petController.js';
import { transferir } from '../controllers/bancoController.js';
import { exigirToken } from '../controllers/authController.js';

const router = Router();

router.get('/', pet.listar);
router.post('/', pet.criar);
router.get('/:codigo', pet.buscar);
router.put('/:codigo', pet.atualizar);
router.delete('/:codigo', pet.excluir);
router.patch('/:codigo/tutor', exigirToken, transferir);

export default router;

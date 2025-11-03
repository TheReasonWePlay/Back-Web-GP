import { Router } from 'express';
import * as AgentController from './agent.controller';
import { verifyToken, authorizeRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyToken, AgentController.getAllAgents);
router.get('/:id', verifyToken, AgentController.getAgentById);
router.post('/', verifyToken, AgentController.createAgent);
router.put('/:id', verifyToken, AgentController.updateAgent);
router.delete('/:id', verifyToken, AgentController.deleteAgent);

export default router;

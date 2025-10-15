import { Router } from 'express';
import * as AgentController from './agent.controller';
import { verifyToken, authorizeRoles } from '../../middlewares/auth.middleware';

const router = Router();

router.get('/', verifyToken, authorizeRoles('Admin', 'Manager'), AgentController.getAllAgents);
router.get('/:id', verifyToken, authorizeRoles('Admin', 'Manager'), AgentController.getAgentById);
router.post('/', verifyToken, authorizeRoles('Admin'), AgentController.createAgent);
router.put('/:id', verifyToken, authorizeRoles('Admin'), AgentController.updateAgent);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), AgentController.deleteAgent);

export default router;

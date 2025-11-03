import express from 'express';
import { WorkScheduleController } from './workSchedule.controller';
import { verifyToken, authorizeRoles } from '../../middlewares/auth.middleware';

const router = express.Router();

// 🧠 Admin & Manager
router.get('/', verifyToken, WorkScheduleController.getAll);
router.get('/:id', verifyToken, WorkScheduleController.getById);

// 👥 Accessible à tous les rôles
router.get('/active', verifyToken, WorkScheduleController.getActive);

// 🔧 Admin only
router.post('/', verifyToken, WorkScheduleController.create);
router.put('/:id', verifyToken, WorkScheduleController.update);
router.delete('/:id', verifyToken, WorkScheduleController.delete);

export default router;

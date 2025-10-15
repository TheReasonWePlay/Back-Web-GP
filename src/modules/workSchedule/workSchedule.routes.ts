import express from 'express';
import { WorkScheduleController } from './workSchedule.controller';
import { verifyToken, authorizeRoles } from '../../middlewares/auth.middleware';

const router = express.Router();

// 🧠 Admin & Manager
router.get('/', verifyToken, authorizeRoles('Admin', 'Manager'), WorkScheduleController.getAll);
router.get('/:id', verifyToken, authorizeRoles('Admin', 'Manager'), WorkScheduleController.getById);

// 👥 Accessible à tous les rôles
router.get('/active', verifyToken, WorkScheduleController.getActive);

// 🔧 Admin only
router.post('/', verifyToken, authorizeRoles('Admin'), WorkScheduleController.create);
router.put('/:id', verifyToken, authorizeRoles('Admin'), WorkScheduleController.update);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), WorkScheduleController.delete);

export default router;

import express from 'express';
import { CalendarHolidayController } from './calendarHoliday.controller';
import { verifyToken, authorizeRoles } from '../../middlewares/auth.middleware';

const router = express.Router();

// 👥 Tous les utilisateurs peuvent lire
router.get('/', verifyToken, CalendarHolidayController.getAll);
router.get('/:id', verifyToken, CalendarHolidayController.getById);

// 🔧 Seuls les Admins peuvent modifier
router.post('/', verifyToken, authorizeRoles('Admin'), CalendarHolidayController.create);
router.put('/:id', verifyToken, authorizeRoles('Admin'), CalendarHolidayController.update);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), CalendarHolidayController.delete);

export default router;

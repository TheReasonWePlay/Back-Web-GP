import express from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { getDailyAttendance, getDayStatistics, getTemporaryExits } from './agentAttendance.controller';

const router = express.Router();

router.get('/:matricule/attendance/:date', verifyToken, getDailyAttendance);
router.get('/:matricule/temporary-exits/:date', verifyToken, getTemporaryExits);
router.get('/', getDayStatistics);

export default router;

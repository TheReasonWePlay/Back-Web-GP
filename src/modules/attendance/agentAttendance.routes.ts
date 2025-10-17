import express from 'express';
import { getDailyAttendance, getDayStatistics, getTemporaryExits } from './agentAttendance.controller';

const router = express.Router();

router.get('/:matricule/attendance/:date', getDailyAttendance);
router.get('/:matricule/temporary-exits/:date', getTemporaryExits);
router.get('/', getDayStatistics);

export default router;

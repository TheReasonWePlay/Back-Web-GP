import express from 'express';
import { getDailyAttendance, getTemporaryExits } from './agentAttendance.controller';

const router = express.Router();

router.get('/:matricule/attendance/:date', getDailyAttendance);
router.get('/:matricule/temporary-exits/:date', getTemporaryExits);

export default router;

import express from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { 
  getDashboardStats, 
  getRecentActivities, 
  getAttendanceStats 
} from './dashboardStat.controller';

const router = express.Router();

router.get('/stats', verifyToken, getDashboardStats);
router.get('/activities', verifyToken, getRecentActivities);
router.get('/attendance-stats', verifyToken, getAttendanceStats);

export default router;

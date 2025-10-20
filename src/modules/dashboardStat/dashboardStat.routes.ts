import express from 'express';
import { 
  getDashboardStats, 
  getRecentActivities, 
  getAttendanceStats 
} from './dashboardStat.controller';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/activities', getRecentActivities);
router.get('/attendance-stats', getAttendanceStats);

export default router;

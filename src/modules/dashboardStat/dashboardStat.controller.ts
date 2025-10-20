import { Request, Response } from 'express';
import { DashboardStatService } from './dashboardStat.service';

// --- GET /dashboard/stats
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const result = await DashboardStatService.getDashboardStats();
    res.status(200).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur getDashboardStats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- GET /dashboard/activities
export const getRecentActivities = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const result = await DashboardStatService.getRecentActivities(limit);
    res.status(200).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur getRecentActivities:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- GET /dashboard/attendance-stats
export const getAttendanceStats = async (req: Request, res: Response) => {
  try {
    const result = await DashboardStatService.getAttendanceStats();
    res.status(200).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur getAttendanceStats:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

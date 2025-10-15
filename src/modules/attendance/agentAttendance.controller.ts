import { Request, Response } from 'express';
import { AttendanceService } from './agentAttendance.service';

// --- GET /agents/:matricule/attendance/:date
export const getDailyAttendance = async (req: Request, res: Response) => {
  try {
    const { matricule, date } = req.params;
    const result = await AttendanceService.getDailyAttendance(matricule, date);
    if (!result.success) return res.status(404).json(result);
    res.status(200).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur attendance:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- GET /agents/:matricule/temporary-exits/:date
export const getTemporaryExits = async (req: Request, res: Response) => {
  try {
    const { matricule, date } = req.params;
    const result = await AttendanceService.getTemporaryExits(matricule, date);
    res.status(200).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur sorties temporaires:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

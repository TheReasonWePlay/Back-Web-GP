import { AttendanceModel, DayStatistics } from './agentAttendance.model';

export const AttendanceService = {
  async getDailyAttendance(matricule: string, date: string) {
    const data = await AttendanceModel.getDailyAttendance(matricule, date);
    if (!data) {
      return { success: false, message: 'Aucune donnée de pointage trouvée.' };
    }
    return { success: true, data };
  },

  async getTemporaryExits(matricule: string, date: string) {
    const data = await AttendanceModel.getTemporaryExits(matricule, date);
    return { success: true, data };
  },

  async getDayStatistics(date: string): Promise<DayStatistics> {
    return await AttendanceModel.getDayStatistics(date);
  },
};

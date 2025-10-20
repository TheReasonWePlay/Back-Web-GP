import { DashboardStatModel } from './dashboardStat.model';

export const DashboardStatService = {
  async getDashboardStats() {
    const data = await DashboardStatModel.getDashboardStats();
    return { success: true, data };
  },

  async getRecentActivities(limit: number) {
    const data = await DashboardStatModel.getRecentActivities(limit);
    return { success: true, data };
  },

  async getAttendanceStats() {
    const data = await DashboardStatModel.getAttendanceStats();
    return { success: true, data };
  },
};

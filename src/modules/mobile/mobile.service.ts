import { MobileDashboardModel, DashboardData, MobilePointageModel, MobileInfoModel } from './mobile.model';

export const MobileDashboardService = {
  async getDashboardData(): Promise<{ success: boolean; data: DashboardData }> {
    const data = await MobileDashboardModel.getDashboardData();
    return { success: true, data };
  },
};
export const MobileInfoService = {
  async getInfo(id_agent: string) {
    return await MobileInfoModel.getInfo(id_agent);
  },
};

export const MobilePointageService = {
  async addPointage(type: string, matricule: string, description?: string, idSortie?:string) {
    if(type === 'Morning' || type === 'Afternoon'){
      return await MobilePointageModel.addPointage(matricule, type);
    }
    else{
      return await MobilePointageModel.addLeaving(matricule, type, description, idSortie);
    }
  },
};

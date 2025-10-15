import { WorkScheduleModel, WorkSchedule } from './workSchedule.model';

export const WorkScheduleService = {
  async getAll() {
    return await WorkScheduleModel.findAll();
  },

  async getActive() {
    return await WorkScheduleModel.findActive();
  },

  async getById(id: string) {
    return await WorkScheduleModel.findById(id);
  },

  async create(data: WorkSchedule) {
    const insertId = await WorkScheduleModel.create(data);
    return await WorkScheduleModel.findById(String(insertId));
  },  

  async update(id: string, data: WorkSchedule) {
    await WorkScheduleModel.update(id, data);
    return await WorkScheduleModel.findById(id);
  },

  async delete(id: string) {
    await WorkScheduleModel.delete(id);
    return { success: true };
  }
};

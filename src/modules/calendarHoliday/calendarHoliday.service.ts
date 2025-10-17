import { CalendarHolidayModel, CalendarHoliday } from './calendarHoliday.model';

export const CalendarHolidayService = {
  async getAll(): Promise<CalendarHoliday[]> {
    return await CalendarHolidayModel.findAll();
  },

  async getById(id: string): Promise<CalendarHoliday | null> {
    return await CalendarHolidayModel.findById(id);
  },

  async create(data: CalendarHoliday): Promise<CalendarHoliday | null> {
    const insertId = await CalendarHolidayModel.create(data);
    return await CalendarHolidayModel.findById(insertId);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    await CalendarHolidayModel.delete(id);
    return { success: true };
  },
};

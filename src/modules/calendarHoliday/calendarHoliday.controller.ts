import { Request, Response } from 'express';
import { CalendarHolidayService } from './calendarHoliday.service';

export const CalendarHolidayController = {
  async getAll(req: Request, res: Response) {
    try {
      const holidays = await CalendarHolidayService.getAll();
      res.json({
        success: true,
        message: 'Holidays fetched successfully',
        data: holidays,
      });
    } catch (err) {
      console.error('[Controller] Error fetching holidays:', err);
      res.status(500).json({
        success: false,
        message: 'Error fetching holidays.',
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const holiday = await CalendarHolidayService.getById(id);
      if (!holiday) {
        return res.status(404).json({
          success: false,
          message: 'Holiday not found.',
        });
      }
      res.json({
        success: true,
        message: 'Holiday fetched successfully',
        data: holiday,
      });
    } catch (err) {
      console.error('[Controller] Error fetching holiday by ID:', err);
      res.status(500).json({
        success: false,
        message: 'Error fetching holiday.',
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const holiday = await CalendarHolidayService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'Holiday created successfully',
        data: holiday,
      });
    } catch (error: any) {
      console.error('[Controller] Error creating holiday:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create holiday',
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await CalendarHolidayService.delete(id);
      res.json({
        success: true,
        message: 'Holiday deleted successfully',
      });
    } catch (err) {
      console.error('[Controller] Error deleting holiday:', err);
      res.status(500).json({
        success: false,
        message: 'Error deleting holiday.',
      });
    }
  },
};

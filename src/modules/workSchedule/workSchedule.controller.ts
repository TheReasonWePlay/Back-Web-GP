import { Request, Response } from 'express';
import { WorkScheduleService } from './workSchedule.service';

export const WorkScheduleController = {
  async getAll(req: Request, res: Response) {
    try {
      const schedules = await WorkScheduleService.getAll();
      res.json({
        success: true,
        message: 'Schedules fetched successfully',
        data: schedules,
      });
    } catch (err) {
      console.error('[Controller] Error fetching schedules:', err);
      res.status(500).json({
        success: false,
        message: 'Error fetching schedules.',
      });
    }
  },

  async getActive(req: Request, res: Response) {
    try {
      const schedule = await WorkScheduleService.getActive();
      res.json({
        success: true,
        message: 'Active schedule fetched successfully',
        data: schedule,
      });
    } catch (err) {
      console.error('[Controller] Error fetching active schedule:', err);
      res.status(500).json({
        success: false,
        message: 'Error fetching active schedule.',
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const schedule = await WorkScheduleService.getById(id);
      if (!schedule) {
        return res.status(404).json({
          success: false,
          message: 'Schedule not found.',
        });
      }
      res.json({
        success: true,
        message: 'Schedule fetched successfully',
        data: schedule,
      });
    } catch (err) {
      console.error('[Controller] Error fetching schedule by ID:', err);
      res.status(500).json({
        success: false,
        message: 'Error fetching schedule.',
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const schedule = await WorkScheduleService.create(req.body);
      return res.status(201).json({
        success: true,
        message: 'Work schedule created successfully',
        data: schedule,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to create work schedule',
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await WorkScheduleService.update(String(id), req.body);
      return res.json({
        success: true,
        message: 'Work schedule updated successfully',
        data: updated,
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: error.message || 'Failed to update work schedule',
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await WorkScheduleService.delete(id);
      res.json({
        success: true,
        message: 'Schedule deleted successfully',
      });
    } catch (err) {
      console.error('[Controller] Error deleting schedule:', err);
      res.status(500).json({
        success: false,
        message: 'Error deleting schedule.',
      });
    }
  },
};

// src/modules/user/user.controller.ts
import { Request, Response } from 'express';
import { UserService } from './user.service';

export const UserController = {
  async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.getAll();
      res.json({
        success: true,
        message: 'Users fetched successfully',
        data: users,
      });
    } catch (err) {
      console.error('[Controller] Error fetching users:', err);
      res.status(500).json({
        success: false,
        message: 'Error fetching users.',
      });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserService.getById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found.',
        });
      }
      res.json({
        success: true,
        message: 'User fetched successfully',
        data: user,
      });
    } catch (err) {
      console.error('[Controller] Error fetching user by ID:', err);
      res.status(500).json({
        success: false,
        message: 'Error fetching user.',
      });
    }
  },

  async create(req: Request, res: Response) {
    try {
      const user = await UserService.create(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user,
      });
    } catch (error: any) {
      console.error('[Controller] Error creating user:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to create user',
      });
    }
  },

  async updatePdw(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await UserService.updatePwd(id, req.body);
      res.json({
        success: true,
        message: 'Password updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('[Controller] Error updating password:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update password',
      });
    }
  },

  async resetPdw(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await UserService.resetPwd(id);
      res.json({
        success: true,
        message: 'Password reset successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('[Controller] Error reset password:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reset password',
      });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updated = await UserService.update(id, req.body);
      res.json({
        success: true,
        message: 'User updated successfully',
        data: updated,
      });
    } catch (error: any) {
      console.error('[Controller] Error updating user:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to update user',
      });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await UserService.delete(id);
      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (err) {
      console.error('[Controller] Error deleting user:', err);
      res.status(500).json({
        success: false,
        message: 'Error deleting user.',
      });
    }
  },
};

// src/modules/user/user.service.ts
import { UserModel, User } from './user.model';

export const UserService = {
  async getAll(): Promise<User[]> {
    return await UserModel.findAll();
  },

  async getById(id: string): Promise<User | null> {
    return await UserModel.findById(id);
  },

  async create(data: User): Promise<User | null> {
    const insertId = await UserModel.create(data);
    return await UserModel.findById(insertId);
  },

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await UserModel.update(id, data);
    return await UserModel.findById(id);
  },

  async delete(id: string): Promise<{ success: boolean }> {
    await UserModel.delete(id);
    return { success: true };
  },
};

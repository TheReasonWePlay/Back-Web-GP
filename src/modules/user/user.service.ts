// src/modules/user/user.service.ts
import { UserModel, User } from './user.model';
import bcrypt from 'bcrypt';

export const UserService = {
  async getAll(): Promise<User[]> {
    return await UserModel.findAll();
  },

  async getById(id: string): Promise<User | null> {
    return await UserModel.findById(id);
  },

  async create(data: Omit<User, 'id' | 'password'>): Promise<User | null> {
    
    const hashedPassword = await bcrypt.hash("SRBHM2025", 10);

    // Crée l'utilisateur avec mot de passe haché
    const insertId = await UserModel.create({
      ...data,
      password: hashedPassword,
      id: ''
    });

    const user = await UserModel.findById(insertId);

    return user;
  },

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await UserModel.update(id, data);
    return await UserModel.findById(id);
  },

  async updatePwd(id: string, data: any): Promise<{ success: boolean }> {
    await UserModel.updatePwd(id, data);
    return { success: true };
  },

  async resetPwd(id: string): Promise<{ success: boolean }> {
    const hashedPassword = await bcrypt.hash("SRBHM2025", 10);
    
    await UserModel.resetPwd(id, hashedPassword);
    return { success: true };
  },

  async delete(id: string): Promise<{ success: boolean }> {
    await UserModel.delete(id);
    return { success: true };
  },
};

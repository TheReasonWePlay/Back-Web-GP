import { Request, Response, NextFunction } from 'express';
import * as AuthService from './auth.service';

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'username and password required' });
    }

    const result = await AuthService.login(username, password);
    if (!result) {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }

    return res.json({ success: true, data: result, message: 'Login successful' });
  } catch (err) {
    next(err);
  }
};

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authentication required' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    // @ts-ignore
    req.user = payload; // type augmentation optional
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
};
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
      // @ts-ignore
      const user = req.user;
  
      if (!user) {
        return res.status(401).json({ success: false, error: 'Unauthorized: no user in request' });
      }
  
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
      }
  
      next();
    };
  };
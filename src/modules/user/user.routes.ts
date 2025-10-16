// src/modules/user/user.routes.ts
import express from 'express';
import { UserController } from './user.controller';
import { verifyToken, authorizeRoles } from '../../middlewares/auth.middleware';

const router = express.Router();

// 👥 Tous les utilisateurs authentifiés peuvent lire
router.get('/', verifyToken, UserController.getAll);
router.get('/:id', verifyToken, UserController.getById);

// 🔧 Seuls les Admins peuvent modifier
router.post('/', verifyToken, authorizeRoles('Admin'), UserController.create);
router.put('/:id', verifyToken, authorizeRoles('Admin'), UserController.update);
router.delete('/:id', verifyToken, authorizeRoles('Admin'), UserController.delete);

export default router;

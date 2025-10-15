import { Router } from 'express';
import * as AuthController from './auth.controller';

const router = Router();

/**
 * POST /auth/login
 * Body: { username, password } where username can be nom_utilisateur or email
 */
router.post('/login', AuthController.login);

export default router;

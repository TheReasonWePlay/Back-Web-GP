import express from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { MobileDashboardController, MobileInfoController, MobilePointageController } from './mobile.controller';

const router = express.Router();

router.get('/dashBoard', verifyToken, MobileDashboardController);
router.get('/info', verifyToken, MobileInfoController);
router.post('/pointage', verifyToken, MobilePointageController);

export default router;

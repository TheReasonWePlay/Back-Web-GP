import express from 'express';
import { MobileDashboardController, MobileInfoController, MobilePointageController } from './mobile.controller';

const router = express.Router();

router.get('/dashBoard', MobileDashboardController);
router.get('/info', MobileInfoController);
router.post('/pointage', MobilePointageController);

export default router;

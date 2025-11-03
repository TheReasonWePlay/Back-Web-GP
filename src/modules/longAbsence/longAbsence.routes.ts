import express from 'express';
import { verifyToken } from '../../middlewares/auth.middleware';
import { 
  getAllAbsences, 
  createAbsence, 
  updateAbsence, 
  deleteAbsence 
} from './longAbsence.controller';

const router = express.Router();

router.get('/:matricule/absences', verifyToken, getAllAbsences);
router.post('/:matricule/absences', verifyToken, createAbsence);
router.put('/:matricule/absences/:absenceId', verifyToken, updateAbsence);
router.delete('/:matricule/absences/:absenceId', verifyToken, deleteAbsence);

export default router;

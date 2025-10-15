import express from 'express';
import { 
  getAllAbsences, 
  createAbsence, 
  updateAbsence, 
  deleteAbsence 
} from './longAbsence.controller';

const router = express.Router();

router.get('/:matricule/absences', getAllAbsences);
router.post('/:matricule/absences', createAbsence);
router.put('/:matricule/absences/:absenceId', updateAbsence);
router.delete('/:matricule/absences/:absenceId', deleteAbsence);

export default router;

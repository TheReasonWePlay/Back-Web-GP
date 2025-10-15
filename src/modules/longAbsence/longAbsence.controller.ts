import { Request, Response } from 'express';
import { LongAbsenceService } from './longAbsence.service';

// --- GET /agents/:matricule/absences
export const getAllAbsences = async (req: Request, res: Response) => {
  try {
    const { matricule } = req.params;
    const result = await LongAbsenceService.getAll(matricule);
    res.status(200).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur GET absences:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- POST /agents/:matricule/absences
export const createAbsence = async (req: Request, res: Response) => {
  try {
    const { matricule } = req.params;
    const data = req.body;
    const result = await LongAbsenceService.create(matricule, data);
    res.status(201).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur POST absence:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- PUT /agents/:matricule/absences/:absenceId
export const updateAbsence = async (req: Request, res: Response) => {
  try {
    const { matricule, absenceId } = req.params;
    const data = req.body;
    const result = await LongAbsenceService.update(matricule, absenceId, data);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur PUT absence:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

// --- DELETE /agents/:matricule/absences/:absenceId
export const deleteAbsence = async (req: Request, res: Response) => {
  try {
    const { matricule, absenceId } = req.params;
    const result = await LongAbsenceService.remove(matricule, absenceId);
    res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    console.error('🔴 [Controller] Erreur DELETE absence:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur.' });
  }
};

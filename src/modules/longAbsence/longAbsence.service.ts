import { LongAbsenceModel } from './longAbsence.model';

export const LongAbsenceService = {
  async getAll(matricule: string) {
    const data = await LongAbsenceModel.findAll(matricule);
    return { success: true, data };
  },

  async create(matricule: string, data: any) {
    const newAbsence = await LongAbsenceModel.create(matricule, data);
    return { success: true, data: newAbsence };
  },

  async update(matricule: string, absenceId: string, data: any) {
    const updated = await LongAbsenceModel.update(matricule, absenceId, data);
    if (!updated) return { success: false, message: 'Absence introuvable' };
    return { success: true, data: updated };
  },

  async remove(matricule: string, absenceId: string) {
    const deleted = await LongAbsenceModel.remove(matricule, absenceId);
    if (!deleted) return { success: false, message: 'Absence non trouvée ou déjà supprimée' };
    return { success: true, message: 'Absence supprimée avec succès' };
  },
};

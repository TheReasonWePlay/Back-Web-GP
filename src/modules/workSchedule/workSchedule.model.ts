import db from '../../config/db';

export interface WorkSchedule {
  id: string;
  name: string;
  morningStart: string;
  morningEnd: string;
  afternoonStart: string;
  afternoonEnd: string;
  tolerance: string;
  isActive: boolean;
}

export const WorkScheduleModel = {
  async findAll(): Promise<WorkSchedule[]> {
    const [rows]: any = await db.query(`
      SELECT 
        id_horaire AS id,
        intitule AS name,
        entree_matin AS morningStart,
        sortie_matin AS morningEnd,
        entree_aprem AS afternoonStart,
        sortie_aprem AS afternoonEnd,
        tolerance_retard AS tolerance,
        actif AS isActive
      FROM horaire_travail
    `);
    return rows;
  },

  async findActive(): Promise<WorkSchedule | null> {
    const [rows]: any = await db.query(`
      SELECT 
        id_horaire AS id,
        intitule AS name,
        entree_matin AS morningStart,
        sortie_matin AS morningEnd,
        entree_aprem AS afternoonStart,
        sortie_aprem AS afternoonEnd,
        tolerance_retard AS tolerance,
        actif AS isActive
      FROM horaire_travail
      WHERE actif = TRUE
      LIMIT 1
    `);
    return rows[0] || null;
  },

  async findById(id: string): Promise<WorkSchedule | null> {
    const [rows]: any = await db.query(`
      SELECT 
        id_horaire AS id,
        intitule AS name,
        entree_matin AS morningStart,
        sortie_matin AS morningEnd,
        entree_aprem AS afternoonStart,
        sortie_aprem AS afternoonEnd,
        tolerance_retard AS tolerance,
        actif AS isActive
      FROM horaire_travail
      WHERE id_horaire = ?
    `, [id]);
    return rows[0] || null;
  },

  async create(data: WorkSchedule): Promise<string> {
    const {
      name,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
      tolerance,
      isActive
    } = data;
  
    if (isActive) {
      await db.query(`UPDATE horaire_travail SET actif = FALSE`);
    }
  
    const [result]: any = await db.query(`
      INSERT INTO horaire_travail 
      (intitule, entree_matin, sortie_matin, entree_aprem, sortie_aprem, tolerance_retard, actif)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, morningStart, morningEnd, afternoonStart, afternoonEnd, tolerance, isActive]);
  
    return String(result.insertId);
  },  

  async update(id: string, data: WorkSchedule): Promise<void> {
    const {
      name,
      morningStart,
      morningEnd,
      afternoonStart,
      afternoonEnd,
      tolerance,
      isActive
    } = data;

    if (isActive) {
      await db.query(`UPDATE horaire_travail SET actif = FALSE`);
    }

    await db.query(`
      UPDATE horaire_travail
      SET intitule = ?, entree_matin = ?, sortie_matin = ?, entree_aprem = ?, sortie_aprem = ?, tolerance_retard = ?, actif = ?
      WHERE id_horaire = ?
    `, [name, morningStart, morningEnd, afternoonStart, afternoonEnd, tolerance, isActive, id]);
  },

  async delete(id: string): Promise<void> {
    await db.query(`DELETE FROM horaire_travail WHERE id_horaire = ?`, [id]);
  }
};

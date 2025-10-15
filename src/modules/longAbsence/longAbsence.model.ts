import db from '../../config/db';

export const LongAbsenceModel = {
  // 🔹 Récupérer toutes les absences longues d’un agent
  async findAll(matricule: string) {
    const [rows]: any = await db.query(
      `SELECT 
          id_absence_longue AS id,
          matricule,
          date_debut AS startDate,
          date_fin AS endDate,
          type AS type,
          motif AS reason,
          CASE
            WHEN CURDATE() > date_fin THEN 'Passed'
            ELSE 'Active'
          END AS status,
          DATEDIFF(date_fin, date_debut) + 1 AS duration
        FROM absence_longue
        WHERE matricule = ?
        ORDER BY date_debut DESC`,
      [matricule]
    );

    return rows.map((r: any) => ({
      ...r,
      duration: Number(r.duration),
    }));
  },

  // 🔹 Créer une nouvelle absence
  async create(matricule: string, data: any) {
    const { startDate, endDate, type, reason } = data;
    const [result]: any = await db.query(
      `INSERT INTO absence_longue (matricule, date_debut, date_fin, type, motif)
       VALUES (?, ?, ?, ?, ?)`,
      [matricule, startDate, endDate, type, reason]
    );

    return {
      id: result.insertId,
      matricule,
      startDate,
      endDate,
      type,
      reason,
      status: 'Active',
      duration:
        (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24) + 1,
      createdAt: new Date().toISOString(),
    };
  },

  // 🔹 Mettre à jour une absence
  async update(matricule: string, absenceId: string, data: any) {
    const fieldMap: Record<string, string> = {
      startDate: 'date_debut',
      endDate: 'date_fin',
      type: 'type',
      reason: 'motif',
    };
  
    // 🧹 Conversion propre des dates ISO → 'YYYY-MM-DD'
    const cleanValue = (key: string, value: any) => {
      if ((key === 'startDate' || key === 'endDate') && typeof value === 'string') {
        return value.split('T')[0]; // coupe la partie "T..."
      }
      return value;
    };
  
    const entries = Object.entries(data)
      .filter(([key]) => fieldMap[key])
      .map(([key, value]) => [fieldMap[key], cleanValue(key, value)]);
  
    if (entries.length === 0) {
      throw new Error('Aucun champ valide à mettre à jour.');
    }
  
    const fields = entries.map(([col]) => `${col} = ?`).join(', ');
    const values = entries.map(([, value]) => value);
  
    await db.query(
      `UPDATE absence_longue 
       SET ${fields} 
       WHERE id_absence_longue = ? AND matricule = ?`,
      [...values, absenceId, matricule]
    );
  
    const [rows]: any = await db.query(
      `SELECT 
          id_absence_longue AS id,
          matricule,
          date_debut AS startDate,
          date_fin AS endDate,
          type AS type,
          motif AS reason,
          CASE
            WHEN CURDATE() > date_fin THEN 'Passed'
            ELSE 'Active'
          END AS status,
          DATEDIFF(date_fin, date_debut) + 1 AS duration
       FROM absence_longue
       WHERE id_absence_longue = ? AND matricule = ?`,
      [absenceId, matricule]
    );
  
    return rows[0] || null;
  },  
    
  // 🔹 Supprimer une absence
  async remove(matricule: string, absenceId: string) {
    const [result]: any = await db.query(
      `DELETE FROM absence_longue WHERE id_absence_longue = ? AND matricule = ?`,
      [absenceId, matricule]
    );
    return result.affectedRows > 0;
  },
};

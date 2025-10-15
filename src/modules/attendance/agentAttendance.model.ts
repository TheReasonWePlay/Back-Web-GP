import db from '../../config/db';

// --- Détails de présence du jour
export const AttendanceModel = {
  async getDailyAttendance(matricule: string, date: string) {
    console.log(`🟢 [Model] Requête pointage pour ${matricule} le ${date}`);

    const [rows]: any = await db.query(
      `SELECT 
          id_pointage AS attendanceId,
          matricule,
          DATE(date) AS date,
          heure_arrive_matin AS morningCheckIn,
          heure_sortie_matin AS morningCheckOut,
          heure_arrive_aprem AS afternoonCheckIn,
          heure_sortie_aprem AS afternoonCheckOut,
          TIME_TO_SEC(TIMEDIFF(heure_sortie_aprem, heure_arrive_matin)) / 3600 AS workHours,
          CASE
            WHEN heure_arrive_matin IS NULL AND heure_sortie_aprem IS NULL THEN 'Absent'
            WHEN heure_arrive_matin > '08:15:00' THEN 'Late'
            WHEN (heure_arrive_matin IS NOT NULL AND (heure_sortie_aprem IS NULL OR heure_arrive_aprem IS NULL)) THEN 'Half-day'
            ELSE 'Present'
          END AS status
        FROM pointage_journalier
        WHERE matricule = ? AND DATE(date) = ?`,
      [matricule, date]
    );

    if (!rows.length) {
      console.log('🔴 Aucun pointage trouvé');
      return null;
    }

    const record = rows[0];
    record.workHours = record.workHours ? parseFloat(record.workHours.toFixed(2)) : 0;

    return record;
  },

  // --- Sorties temporaires du jour
  async getTemporaryExits(matricule: string, date: string) {
    console.log(`🟢 [Model] Requête sorties temporaires pour ${matricule} le ${date}`);

    const [rows]: any = await db.query(
      `SELECT 
          at.id_absence_temporaire AS id,
          pj.id_pointage AS attendanceId,
          pj.matricule,
          DATE(pj.date) AS date,
          at.heure_sortie_temporaire AS exitTime,
          at.heure_retour_temporaire AS returnTime,
          at.description,
          TIME_TO_SEC(TIMEDIFF(at.heure_retour_temporaire, at.heure_sortie_temporaire)) / 60 AS duration
        FROM absence_temporaire at
        JOIN pointage_journalier pj ON pj.id_pointage = at.id_pointage
        WHERE pj.matricule = ? AND DATE(pj.date) = ?`,
      [matricule, date]
    );

    return rows.map((r: any) => ({
      ...r,
      duration: r.duration ? parseFloat((r.duration / 60).toFixed(2)) : 0, // en heures
    }));
  },
};

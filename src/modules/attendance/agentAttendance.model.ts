import db from '../../config/db';

export interface TemporaryExitInfo {
  id: string;
  exitTime: string;
  returnTime: string;
  description: string;
}

export interface PointageRecord {
  id: string;
  agentId: string;
  agentName: string;
  division: string;
  checkInAM: string;
  checkOutAM: string;
  checkInPM: string;
  checkOutPM: string;
  status: 'present' | 'late' | 'early-departure' | 'overtime';
  totalMissedTime: string;
  temporaryExits: TemporaryExitInfo[];
}

export interface DayStatistics {
  date: string;
  totalAgents: number;
  present: number;
  absent: number;
  late: number;
  attendanceRate: number;
  punctualityRate: number;
  pointageRecords: PointageRecord[];
}


// --- Détails de présence du jour
export const AttendanceModel = {
  async getDayStatistics(date: string): Promise<DayStatistics> {
    // ✅ 1. Récupérer tous les agents
    const [agents]: any = await db.query(`
      SELECT 
        a.matricule AS agentId,
        a.nom AS agentName,
        a.division,
        p.id_pointage,
        p.heure_arrive_matin AS check_in_am,
        p.heure_sortie_matin AS check_out_am,
        p.heure_arrive_aprem AS check_in_pm,
        p.heure_sortie_aprem AS check_out_pm
      FROM agent a
      LEFT JOIN pointage_journalier p ON a.matricule = p.matricule AND DATE(p.date) = ?
    `, [date]);

    const totalAgents = agents.length;
    let present = 0;
    let absent = 0;
    let late = 0;
    const pointageRecords: PointageRecord[] = [];

    for (const a of agents) {
      const isPresent = !!a.id_pointage;
      const status = isPresent ? 'present' : 'absent';
      if (status === 'present') present++;
      else absent++;

      // Exemple simple: si check_in_am > 08:05 => late
      if (a.check_in_am && a.check_in_am > '08:05:00') late++;

      const [exits]: any = await db.query(`
        SELECT 
          id_absence_temporaire AS id,
          heure_sortie_temporaire AS exitTime,
          heure_retour_temporaire AS returnTime,
          description
        FROM absence_temporaire
        WHERE id_pointage = ?
      `, [a.id_pointage]);

      pointageRecords.push({
        id: a.id_pointage || '',
        agentId: a.agentId,
        agentName: a.agentName,
        division: a.division,
        checkInAM: a.check_in_am || '',
        checkOutAM: a.check_out_am || '',
        checkInPM: a.check_in_pm || '',
        checkOutPM: a.check_out_pm || '',
        status: status as any,
        totalMissedTime: '0h 00m',
        temporaryExits: exits || [],
      });
    }

    const attendanceRate = totalAgents > 0 ? (present / totalAgents) * 100 : 0;
    const punctualityRate = present > 0 ? ((present - late) / present) * 100 : 0;

    return {
      date,
      totalAgents,
      present,
      absent,
      late,
      attendanceRate: Number(attendanceRate.toFixed(2)),
      punctualityRate: Number(punctualityRate.toFixed(2)),
      pointageRecords,
    };
  },

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

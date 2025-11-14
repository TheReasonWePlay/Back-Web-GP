import { Query } from 'mysql2/typings/mysql/lib/protocol/sequences/Query';
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
  status: string;
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
    //
    // 1️⃣ Charger tous les agents + leurs pointages + horaire
    //
    const [agents]: any = await db.query(
      `
        SELECT 
          a.matricule AS agentId,
          a.nom AS agentName,
          a.division,
  
          p.id_pointage,
          p.heure_arrive_matin AS checkInAM,
          p.heure_sortie_matin AS checkOutAM,
          p.heure_arrive_aprem AS checkInPM,
          p.heure_sortie_aprem AS checkOutPM,
  
          h.entree_matin AS expectedAM,
          h.tolerance_retard AS lateTolerance
        FROM agent a
        LEFT JOIN pointage_journalier p 
            ON a.matricule = p.matricule AND DATE(p.date) = ?
        LEFT JOIN horaire_travail h 
            ON p.id_horaire = h.id_horaire
      `,
      [date]
    );
  
    //
    // 2️⃣ Précharger toutes les sorties temporaires pour la journée
    //
    const [allExits]: any = await db.query(
      `
        SELECT 
          at.id_pointage,
          id_absence_temporaire AS id,
          heure_sortie_temporaire AS exitTime,
          heure_retour_temporaire AS returnTime,
          description
        FROM absence_temporaire at
        JOIN pointage_journalier pj ON pj.id_pointage = at.id_pointage
        WHERE DATE(pj.date) = ?
      `,
      [date]
    );
  
    // Réorganisation par id_pointage
    const exitsByPointage: Record<string, any[]> = {};
    for (const e of allExits) {
      if (!exitsByPointage[e.id_pointage]) exitsByPointage[e.id_pointage] = [];
      exitsByPointage[e.id_pointage].push(e);
    }
  
    //
    // 3️⃣ Statistiques globales
    //
    const totalAgents = agents.length;
    let present = 0;
    let absent = 0;
    let late = 0;
  
    const pointageRecords: PointageRecord[] = [];
  
    //
    // 4️⃣ Utilitaire interne
    //
    const timeToSec = (t: string | null) => {
      if (!t) return 0;
      const [h, m, s] = t.split(":").map(Number);
      return h * 3600 + m * 60 + s;
    };
  
    const formatHM = (sec: number) => {
      if (sec <= 0) return "0h 00m";
      const h = Math.floor(sec / 3600);
      const m = Math.floor((sec % 3600) / 60);
      return `${h}h ${m}m`;
    };
  
    //
    // 5️⃣ Analyse agent par agent
    //
    for (const a of agents) {
      const isPresent = !!a.id_pointage;
  
      if (isPresent) present++;
      else absent++;
  
      // Vérification retard
      let isLate = false;
      if (a.checkInAM && a.expectedAM) {
        const tolerance = a.lateTolerance ? Number(a.lateTolerance) : 0;
        const expected = timeToSec(a.expectedAM) + tolerance * 60;
        const actual = timeToSec(a.checkInAM);
  
        if (actual > expected) {
          late++;
          isLate = true;
        }
      }
  
      // Calcul des heures travaillées
      const morning =
        Math.max(0, timeToSec(a.checkOutAM) - timeToSec(a.checkInAM));
  
      const afternoon =
        Math.max(0, timeToSec(a.checkOutPM) - timeToSec(a.checkInPM));
  
      const totalSeconds = morning + afternoon;
  
      const agentExits = exitsByPointage[a.id_pointage] || [];
  
      pointageRecords.push({
        id: a.id_pointage || "",
        agentId: a.agentId,
        agentName: a.agentName,
        division: a.division,
        checkInAM: a.checkInAM || "",
        checkOutAM: a.checkOutAM || "",
        checkInPM: a.checkInPM || "",
        checkOutPM: a.checkOutPM || "",
        status: isPresent ? (isLate ? "late" : "present") : "absent",
        totalMissedTime: formatHM(totalSeconds),
        temporaryExits: agentExits,
      });
    }
  
    //
    // 6️⃣ Finaliser les ratios
    //
    const attendanceRate =
      totalAgents > 0 ? (present / totalAgents) * 100 : 0;
  
    const punctualityRate =
      present > 0 ? ((present - late) / present) * 100 : 0;
  
    //
    // 7️⃣ Retour final propre
    //

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
          a.id_pointage AS attendanceId,
          a.matricule,
          DATE(a.date) AS date,
          a.heure_arrive_matin AS morningCheckIn,
          a.heure_sortie_matin AS morningCheckOut,
          a.heure_arrive_aprem AS afternoonCheckIn,
          a.heure_sortie_aprem AS afternoonCheckOut,
          TIME_TO_SEC(TIMEDIFF(a.heure_sortie_matin, a.heure_arrive_matin)
                      + TIMEDIFF(a.heure_sortie_aprem, a.heure_arrive_aprem)) AS workSeconds,
          CASE
            WHEN a.heure_arrive_matin IS NULL AND a.heure_sortie_aprem IS NULL THEN 'Absent'
            WHEN a.heure_arrive_matin > '08:15:00' THEN 'Late'
            WHEN (a.heure_arrive_matin IS NOT NULL AND 
                  (a.heure_sortie_aprem IS NULL OR a.heure_arrive_aprem IS NULL)) THEN 'Half-day'
            ELSE 'Present'
          END AS status,
          h.entree_matin,
          h.sortie_matin,
          h.entree_aprem,
          h.sortie_aprem,
          h.tolerance_retard AS tolerance
        FROM pointage_journalier AS a 
        JOIN horaire_travail AS h ON a.id_horaire = h.id_horaire
        WHERE matricule = ? AND DATE(date) = ?`,
      [matricule, date]
    );
  
    if (!rows.length) {
      console.log("🔴 Aucun pointage trouvé");
      return null;
    }
  
    const r = rows[0];
  
    // 🔍 Vérification congé séparée
    const [longAbs]: any = await db.query(
      `SELECT 
        type AS type_abs,
         CASE 
           WHEN DATE(?) BETWEEN date_debut AND date_fin THEN TRUE 
           ELSE FALSE
         END AS conge
       FROM absence_longue 
       WHERE matricule = ?
       LIMIT 1`,
      [date, matricule]
    );
  
    // Si aucune ligne trouvée → par défaut false
    r.conge = longAbs.length ? !!longAbs[0].conge : false;
    r.type_abs = longAbs[0].type_abs;
  
    // Convertit HH:MM:SS → secondes
    const timeToSeconds = (t: string | null): number => {
      if (!t) return 0;
      const [h, m, s] = t.split(":").map(Number);
      return h * 3600 + m * 60 + s;
    };
  
    let totalSeconds = r.workSeconds;
  
    if (totalSeconds === null) {
      const morningStart = timeToSeconds(r.morningCheckIn);
      const morningEnd = timeToSeconds(r.morningCheckOut);
      const afternoonStart = timeToSeconds(r.afternoonCheckIn);
      const afternoonEnd = timeToSeconds(r.afternoonCheckOut);
  
      const morning = morningEnd > morningStart ? morningEnd - morningStart : 0;
      const afternoon = afternoonEnd > afternoonStart ? afternoonEnd - afternoonStart : 0;
  
      totalSeconds = morning + afternoon;
    }
  
    if (totalSeconds < 0 || isNaN(totalSeconds)) totalSeconds = 0;
  
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
  
    r.workHours = `${hours}h ${minutes}m`;
  
    return r;
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
          TIME_TO_SEC(TIMEDIFF(at.heure_retour_temporaire, at.heure_sortie_temporaire)) AS duration_seconds
        FROM absence_temporaire at
        JOIN pointage_journalier pj ON pj.id_pointage = at.id_pointage
        WHERE pj.matricule = ? AND DATE(pj.date) = ?`,
      [matricule, date]
    );
  
    return rows.map((r: any) => {
      let totalSec = r.duration_seconds;
  
      // Sécurisation : jamais de secondes négatives
      if (!totalSec || totalSec < 0) totalSec = 0;
  
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
  
      return {
        ...r,
        duration: `${hours}h ${minutes}m`,
      };
    });
  },
};

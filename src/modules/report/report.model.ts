// modules/report/report.model.ts
import db from "../../config/db";

export interface ServiceRow {
  service: string;
  effectif: number;
  tauxAbs: number; // en %
  retards: number;
  heuresSupp: number; // en heures (float)
  departsAnticipes: number;
}

export interface MonthlySummary {
  absenteismeByWeek: { week: number; value: number }[];
  retardsByWeek: { week: number; value: number }[];
  totalRetards: number;
  totalAbsenceHours: number;
  effectifMoyen: number;
}

export const ReportModel = {
  // récupère toutes les divisions (non null)
  getServices: async (): Promise<string[]> => {
    const [rows]: any = await db.query(
      `SELECT DISTINCT division AS service FROM agent WHERE division IS NOT NULL ORDER BY division`
    );
    return rows.map((r: any) => r.service);
  },

  // effectif par service (nombre d'agents)
  getEffectifByService: async (service: string): Promise<number> => {
    const [[row]]: any = await db.query(
      `SELECT COUNT(*) AS c FROM agent WHERE division = ?`,
      [service]
    );
    return row.c ?? 0;
  },

  // heures d'absence longue (en heures) pour une période et service
  getAbsenceLonguesHoursByService: async (service: string, startDate: string, endDate: string): Promise<number> => {
    // calcule la somme des jours * 8h approximatif entre date_debut/date_fin intersectant la période
    const [rows]: any = await db.query(
      `SELECT al.matricule,
              GREATEST(DATEDIFF(LEAST(al.date_fin, ?), GREATEST(al.date_debut, ?)) + 1, 0) AS days
       FROM absence_longue al
       JOIN agent a ON a.matricule = al.matricule
       WHERE a.division = ?
         AND NOT (al.date_fin < ? OR al.date_debut > ?)
      `,
      [endDate, startDate, service, startDate, endDate]
    );
    const totalDays = rows.reduce((s: number, r: any) => s + (r.days > 0 ? r.days : 0), 0);
    const hours = totalDays * 8; // approximation : 1 jour = 8h
    return hours;
  },

  // absences non autorisées : agents sans pointage sur la période et sans absence_longue (count)
  getAbsencesNonAutoriseesCountByService: async (service: string, startDate: string, endDate: string): Promise<number> => {
    const [rows]: any = await db.query(
      `SELECT COUNT(DISTINCT a.matricule) AS n
       FROM agent a
       WHERE a.division = ?
         AND a.matricule NOT IN (
           SELECT DISTINCT matricule FROM pointage_journalier WHERE date BETWEEN ? AND ?
         )
         AND a.matricule NOT IN (
           SELECT DISTINCT matricule FROM absence_longue WHERE NOT (date_fin < ? OR date_debut > ?)
         )
      `,
      [service, startDate, endDate, startDate, endDate]
    );
    return rows[0]?.n ?? 0;
  },

  // nombre de retards total sur période (arrivée matin/aprem > entree + tolerance)
  getRetardsByService: async (service: string, startDate: string, endDate: string): Promise<number> => {
    const [rows]: any = await db.query(
      `SELECT COUNT(*) AS n
       FROM pointage_journalier p
       JOIN agent a ON a.matricule = p.matricule
       JOIN horaire_travail h ON h.id_horaire = p.id_horaire
       WHERE a.division = ?
         AND p.date BETWEEN ? AND ?
         AND (
           (p.heure_arrive_matin IS NOT NULL AND p.heure_arrive_matin > ADDTIME(h.entree_matin, SEC_TO_TIME(h.tolerance_retard*60)))
           OR
           (p.heure_arrive_aprem IS NOT NULL AND p.heure_arrive_aprem > ADDTIME(h.entree_aprem, SEC_TO_TIME(h.tolerance_retard*60)))
         )
      `,
      [service, startDate, endDate]
    );
    return rows[0]?.n ?? 0;
  },

  // heures supp = somme( (heure_sortie - scheduled_sortie) ) positives en heures
  getHeuresSuppByService: async (service: string, startDate: string, endDate: string): Promise<number> => {
    const [rows]: any = await db.query(
      `SELECT
         SUM(
           GREATEST(
             (IFNULL(TIME_TO_SEC(p.heure_sortie_matin),0) - TIME_TO_SEC(h.sortie_matin)),
             0
           ) +
           GREATEST(
             (IFNULL(TIME_TO_SEC(p.heure_sortie_aprem),0) - TIME_TO_SEC(h.sortie_aprem)),
             0
           )
         ) AS secs
       FROM pointage_journalier p
       JOIN agent a ON a.matricule = p.matricule
       JOIN horaire_travail h ON h.id_horaire = p.id_horaire
       WHERE a.division = ?
         AND p.date BETWEEN ? AND ?
      `,
      [service, startDate, endDate]
    );
    const secs = rows[0]?.secs ?? 0;
    return secs / 3600;
  },

  // départs anticipés (sortie < scheduled sortie) count
  getDepartsAnticipesByService: async (service: string, startDate: string, endDate: string): Promise<number> => {
    const [rows]: any = await db.query(
      `SELECT COUNT(*) AS n
       FROM pointage_journalier p
       JOIN agent a ON a.matricule = p.matricule
       JOIN horaire_travail h ON h.id_horaire = p.id_horaire
       WHERE a.division = ?
         AND p.date BETWEEN ? AND ?
         AND (
           (p.heure_sortie_matin IS NOT NULL AND p.heure_sortie_matin < h.sortie_matin)
           OR
           (p.heure_sortie_aprem IS NOT NULL AND p.heure_sortie_aprem < h.sortie_aprem)
         )
      `,
      [service, startDate, endDate]
    );
    return rows[0]?.n ?? 0;
  },

  // effectif moyen: moyenne d'agents actifs (ayant au moins un pointage) par jour sur la période
  getEffectifMoyen: async (startDate: string, endDate: string): Promise<number> => {
    const [rows]: any = await db.query(
      `SELECT AVG(cnt) AS avg_effectif FROM (
         SELECT date, COUNT(DISTINCT matricule) AS cnt
         FROM pointage_journalier
         WHERE date BETWEEN ? AND ?
         GROUP BY date
       ) t`,
      [startDate, endDate]
    );
    return Number(rows[0]?.avg_effectif ?? 0);
  },

  // total heures d'absence (from absence_longue) pour period
  getTotalAbsenceHours: async (startDate: string, endDate: string): Promise<number> => {
    const [rows]: any = await db.query(
      `SELECT SUM(GREATEST(DATEDIFF(LEAST(date_fin, ?), GREATEST(date_debut, ?)) + 1, 0)) AS days
       FROM absence_longue
       WHERE NOT (date_fin < ? OR date_debut > ?)
      `,
      [endDate, startDate, startDate, endDate]
    );
    const days = rows[0]?.days ?? 0;
    return days * 8;
  },

  // récupère retards par classe (5-15, 15-30, >30) et liste récurrents (matricules avec > threshold retards in month)
  getRetardBreakdownAndRecurrents: async (startDate: string, endDate: string, recurThreshold = 3): Promise<{ short: number; medium: number; long: number; total: number; recurrents: string[] }> => {
    // compute each retard duration per record
    const [rows]: any = await db.query(
      `SELECT p.matricule,
              LEAST(
                COALESCE(TIME_TO_SEC(p.heure_arrive_matin),0) - TIME_TO_SEC(h.entree_matin),
                COALESCE(TIME_TO_SEC(p.heure_arrive_aprem),0) - TIME_TO_SEC(h.entree_aprem)
              ) AS max_delay
       FROM pointage_journalier p
       JOIN horaire_travail h ON h.id_horaire = p.id_horaire
       WHERE p.date BETWEEN ? AND ?
         AND (
            (p.heure_arrive_matin IS NOT NULL AND p.heure_arrive_matin > ADDTIME(h.entree_matin, SEC_TO_TIME(h.tolerance_retard*60)))
            OR
            (p.heure_arrive_aprem IS NOT NULL AND p.heure_arrive_aprem > ADDTIME(h.entree_aprem, SEC_TO_TIME(h.tolerance_retard*60)))
         )
      `,
      [startDate, endDate]
    );

    let short = 0, medium = 0, long = 0;
    const counts: Record<string, number> = {};
    for (const r of rows) {
      const delay = Number(r.max_delay ?? 0);
      if (delay <= 0) continue;
      if (delay <= 15 * 60) short++;
      else if (delay <= 30 * 60) medium++;
      else long++;
      counts[r.matricule] = (counts[r.matricule] || 0) + 1;
    }

    const recurrents = Object.entries(counts).filter(([, c]) => c >= recurThreshold).map(([mat]) => mat);

    return { short, medium, long, total: short + medium + long, recurrents };
  },

  // données par semaine pour graphique (absenteisme% and retards count)
  getWeeklySeries: async (weeks: number[], year: number, startDates: string[], endDates: string[]) => {
    // weeks param unused; use startDates/endDates arrays of same length
    const abs: { week: number; value: number }[] = [];
    const ret: { week: number; value: number }[] = [];

    for (let i = 0; i < startDates.length; i++) {
      const s = startDates[i], e = endDates[i];
      // absentéisme% = (sum absence hours / (effectif * 8 * nbDays)) *100  -> simplified: agents absent at least one day / total agents
      const [totAgentsRow]: any = await db.query(`SELECT COUNT(*) AS c FROM agent`);
      const totalAgents = totAgentsRow[0]?.c ?? 1;

      const [absRows]: any = await db.query(
        `SELECT COUNT(DISTINCT matricule) AS n FROM absence_longue WHERE NOT (date_fin < ? OR date_debut > ?)`,
        [s, e]
      );
      const absentCount = absRows[0]?.n ?? 0;

      const [retRows]: any = await db.query(
        `SELECT COUNT(*) AS n FROM pointage_journalier p JOIN horaire_travail h ON h.id_horaire = p.id_horaire
         WHERE p.date BETWEEN ? AND ?
         AND (
           (p.heure_arrive_matin IS NOT NULL AND p.heure_arrive_matin > ADDTIME(h.entree_matin, SEC_TO_TIME(h.tolerance_retard*60)))
           OR
           (p.heure_arrive_aprem IS NOT NULL AND p.heure_arrive_aprem > ADDTIME(h.entree_aprem, SEC_TO_TIME(h.tolerance_retard*60)))
         )`,
        [s, e]
      );
      const retCount = retRows[0]?.n ?? 0;

      abs.push({ week: i + 1, value: Math.round((absentCount / totalAgents) * 100 * 10) / 10 });
      ret.push({ week: i + 1, value: retCount });
    }

    return { abs, ret };
  }

};

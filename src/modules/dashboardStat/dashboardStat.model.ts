import db from '../../config/db';

export interface DashboardStats {
  totalAgents: number;
  presentToday: number;
  absentToday: number;
  lateArrivals: number;
  onLeaveToday: number;
  attendanceRate: number;
  avgWorkHours: number;
}

export interface RecentActivity {
  agentName: string;
  type: 'check-in' | 'check-out' | 'leave-request';
  description: string;
  timestamp: string;
}

export interface AttendanceStats {
  daily: {
    date: string;
    present: number;
    absent: number;
    late: number;
  }[];
  monthly: {
    month: string;
    present: number;
  }[];
}

export const DashboardStatModel = {
  // --- Statistiques globales du tableau de bord
  async getDashboardStats(): Promise<DashboardStats> {
    // Total agents
    const [total]: any = await db.query(`SELECT COUNT(*) AS total FROM agent`);
    const totalAgents = total[0].total || 0;

    // Présents aujourd'hui
    const [present]: any = await db.query(`
      SELECT COUNT(*) AS present 
      FROM pointage_journalier 
      WHERE DATE(date) = CURDATE()
    `);

    // En retard
    const [late]: any = await db.query(`
      SELECT COUNT(*) AS late 
      FROM pointage_journalier 
      WHERE DATE(date) = CURDATE() AND heure_arrive_matin > '08:15:00'
    `);

    // En congé aujourd'hui
    const [onLeave]: any = await db.query(`
      SELECT COUNT(DISTINCT a.matricule) AS onLeave
      FROM absence_longue al
      JOIN agent a ON a.matricule = al.matricule
      WHERE CURDATE() BETWEEN al.date_debut AND al.date_fin
    `);

    // Moyenne d'heures travaillées aujourd'hui
    const [avgWorkHours]: any = await db.query(`
      SELECT AVG(
        TIME_TO_SEC(TIMEDIFF(heure_sortie_aprem, heure_arrive_matin)) / 3600
      ) AS avgHours
      FROM pointage_journalier
      WHERE DATE(date) = CURDATE()
    `);

    const presentToday = present[0].present || 0;
    const lateArrivals = late[0].late || 0;
    const onLeaveToday = onLeave[0].onLeave || 0;
    const absentToday = Math.max(totalAgents - presentToday - onLeaveToday, 0);
    const attendanceRate = totalAgents ? (presentToday / totalAgents) * 100 : 0;

    return {
      totalAgents,
      presentToday,
      absentToday,
      lateArrivals,
      onLeaveToday,
      attendanceRate: Number(Number(attendanceRate).toFixed(2)),
      avgWorkHours: avgWorkHours[0].avgHours ? Number(Number(avgWorkHours[0].avgHours).toFixed(2)) : 0,
    };
  },

  // --- Activités récentes
  async getRecentActivities(limit: number = 5): Promise<RecentActivity[]> {
    const [rows]: any = await db.query(
      `
      SELECT 
        a.nom AS agentName,
        'check-in' AS type,
        CONCAT('Checked in at ', p.heure_arrive_matin) AS description,
        CONCAT(DATE(p.date), ' ', p.heure_arrive_matin) AS timestamp
      FROM pointage_journalier p
      JOIN agent a ON a.matricule = p.matricule
      WHERE p.heure_arrive_matin IS NOT NULL

      UNION

      SELECT 
        a.nom AS agentName,
        'check-out' AS type,
        CONCAT('Checked out at ', p.heure_sortie_aprem) AS description,
        CONCAT(DATE(p.date), ' ', p.heure_sortie_aprem) AS timestamp
      FROM pointage_journalier p
      JOIN agent a ON a.matricule = p.matricule
      WHERE p.heure_sortie_aprem IS NOT NULL

      UNION

      SELECT 
        a.nom AS agentName,
        'leave-request' AS type,
        CONCAT('On leave: ', al.motif) AS description,
        al.date_debut AS timestamp
      FROM absence_longue al
      JOIN agent a ON a.matricule = al.matricule

      ORDER BY timestamp DESC
      LIMIT ?
      `,
      [limit]
    );

    return rows;
  },

  // --- Statistiques de présence (graphique)
  async getAttendanceStats(): Promise<AttendanceStats> {
    // Quotidien (7 derniers jours)
    const [daily]: any = await db.query(`
      SELECT 
        DATE(date) AS date,
        COUNT(*) AS present,
        SUM(CASE WHEN heure_arrive_matin > '08:15:00' THEN 1 ELSE 0 END) AS late,
        (SELECT COUNT(*) FROM agent) - COUNT(*) AS absent
      FROM pointage_journalier
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(date)
      ORDER BY DATE(date)
    `);

    // Mensuel (12 derniers mois)
    const [monthly]: any = await db.query(`
      SELECT 
        DATE_FORMAT(date, '%Y-%m') AS month,
        COUNT(*) AS present
      FROM pointage_journalier
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    return { daily, monthly };
  },
};

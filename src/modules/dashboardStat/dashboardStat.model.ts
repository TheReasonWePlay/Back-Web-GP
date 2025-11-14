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

    const now = new Date();
    const hour1 = now.getHours();

    // Récupération de la date du jour
    const [pointages]: any = await db.query(`
      SELECT pj.*, h.tolerance_retard, h.entree_matin, h.entree_aprem
      FROM pointage_journalier pj
      JOIN horaire_travail h ON pj.id_horaire = h.id_horaire
      WHERE DATE(pj.date) = CURDATE()
    `);

    let present = 0;
    let late = 0;

    (pointages as any[]).forEach(pj => {
      // Présent si heure d'arrivée matin existante
      if(hour1 < 12){
        if (pj.heure_arrive_matin || pj.heure_arrive_aprem) present++;

        // Retard si arrivée après entrée + tolérance
        if (pj.heure_arrive_matin) {
          const scheduled = pj.entree_matin; // ex: "08:00:00"
          const tolerance = pj.tolerance_retard; // minutes
          const arrive = pj.heure_arrive_matin;
  
          const scheduledMinutes = Number(scheduled.split(':')[0]) * 60 + Number(scheduled.split(':')[1]);
          const arriveMinutes = Number(arrive.split(':')[0]) * 60 + Number(arrive.split(':')[1]);
  
          if (arriveMinutes > scheduledMinutes + tolerance) late++;
        }
      }
      else{
        if (pj.heure_arrive_aprem) present++;

        if (pj.heure_arrive_aprem) {
          const scheduled = pj.entree_aprem; // ex: "08:00:00"
          const tolerance = pj.tolerance_retard; // minutes
          const arrive = pj.heure_arrive_aprem;
  
          const scheduledMinutes = Number(scheduled.split(':')[0]) * 60 + Number(scheduled.split(':')[1]);
          const arriveMinutes = Number(arrive.split(':')[0]) * 60 + Number(arrive.split(':')[1]);
  
          if (arriveMinutes > scheduledMinutes + tolerance) late++;
        }
      }
     
    });

    // Moyenne d'heures travaillées aujourd'hui
    const [avgWorkHours]: any = await db.query(`
      SELECT AVG(
        TIME_TO_SEC(TIMEDIFF(heure_sortie_aprem, heure_arrive_matin)) / 3600
      ) AS avgHours
      FROM pointage_journalier
    `);

    const presentToday = present || 0;
    const lateArrivals = late || 0;
    const onLeaveToday = 0;
    const absentToday = Math.max(totalAgents - presentToday, 0);
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
        COUNT(*) AS "Taux de présence"
      FROM pointage_journalier
      GROUP BY DATE_FORMAT(date, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `);

    return { daily, monthly };
  },
};

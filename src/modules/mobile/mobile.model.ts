import db from '../../config/db';

export interface DashboardData {
  present: number;
  late: number;
  agent: number;
  percent: number;
}

export const MobileDashboardModel = {
  // --- Statistiques du dashboard
  async getDashboardData(): Promise<DashboardData> {
    // Nombre total d'agents
    const [agents]: any = await db.query(`SELECT COUNT(*) AS total FROM agent`);
    const totalAgents = agents[0].total || 0;


    // Récupération de la date du jour
    const [pointages]: any = await db.query(`
      SELECT pj.*, h.tolerance_retard, h.entree_matin
      FROM pointage_journalier pj
      JOIN horaire_travail h ON pj.id_horaire = h.id_horaire
      WHERE DATE(pj.date) = CURDATE()
    `);

    let present = 0;
    let late = 0;

    (pointages as any[]).forEach(pj => {
      // Présent si heure d'arrivée matin existante
      if (pj.heure_arrive_matin) present++;

      // Retard si arrivée après entrée + tolérance
      if (pj.heure_arrive_matin) {
        const scheduled = pj.entree_matin; // ex: "08:00:00"
        const tolerance = pj.tolerance_retard; // minutes
        const arrive = pj.heure_arrive_matin;

        const scheduledMinutes = Number(scheduled.split(':')[0]) * 60 + Number(scheduled.split(':')[1]);
        const arriveMinutes = Number(arrive.split(':')[0]) * 60 + Number(arrive.split(':')[1]);

        if (arriveMinutes > scheduledMinutes + tolerance) late++;
      }
    });

    const percent = totalAgents > 0 ? Math.round((present / totalAgents) * 100) : 0;

    return { present, late, agent: totalAgents, percent};
  },
};
// --- Info agent
export const MobileInfoModel = {
  async getInfo(matricule: string) {
    // --- Pointages du jour ---
    const [rows]: any = await db.query(
      `SELECT 
         id_pointage AS idP, 
         heure_arrive_matin AS c_in_AM,
         heure_sortie_matin AS c_out_AM,
         heure_arrive_aprem AS c_in_PM,
         heure_sortie_aprem AS c_out_PM
       FROM pointage_journalier
       WHERE matricule = ? 
       AND DATE(date) = CURDATE()`,
      [matricule]
    );
    
    const [name]: any = await db.query(
      `SELECT nom AS name FROM agent
       WHERE matricule = ?`,
       [matricule]
    );

    const nom = name[0];

    if (!rows.length) {
      // Aucun pointage pour aujourd'hui
      return {
        nom: nom.name ?? "a",
        c_in_AM: "00:00",
        c_out_AM: "00:00",
        c_in_PM: "00:00",
        c_out_PM: "00:00",
        sorties: []
      };
    }

    const pointage = rows[0];

    // --- Sorties temporaires liées au pointage ---
    const [leaveRows]: any = await db.query(
      `SELECT 
         heure_sortie_temporaire AS hSortie,
         heure_retour_temporaire AS hRentree,
         description AS descr,
         id_absence_temporaire AS idLeave
        FROM absence_temporaire
       WHERE id_pointage = ?`,
      [pointage.idP]
    );

    // Retourner exactement ce que le front attend
    return {
      nom: nom.name ?? "a",
      c_in_AM: pointage.c_in_AM ?? "00:00",
      c_out_AM: pointage.c_out_AM ?? "00:00",
      c_in_PM: pointage.c_in_PM ?? "00:00",
      c_out_PM: pointage.c_out_PM ?? "00:00",
      sorties: leaveRows.map((row: any) => ({
        descr: row.descr,
        hSortie: row.hSortie ?? "00:00",
        hRentree: row.hRentree ?? "00:00",
        idLeave: String(row.idLeave) ?? ""
      }))
    };
  }
};


// --- Pointage (sortie/rentrée)
export const MobilePointageModel = {
  async addPointage(id_agent: string, type: string) {
    const heure = new Date().toLocaleTimeString('fr-FR', { hour12: false });
    const [existing]: any = await db.query(
      `SELECT id_pointage FROM pointage_journalier WHERE matricule = ? AND DATE(date) = CURDATE()`,
      [id_agent]
    );
    const [existingPM]: any = await db.query(
      `SELECT heure_arrive_aprem FROM pointage_journalier WHERE matricule = ? AND DATE(date) = CURDATE()`,
      [id_agent]
    );
    const [existingAM]: any = await db.query(
      `SELECT heure_arrive_matin FROM pointage_journalier WHERE matricule = ? AND DATE(date) = CURDATE()`,
      [id_agent]
    );
    const [activeShedule]: any = await db.query(
      `SELECT id_horaire FROM horaire_travail WHERE actif = 1`
    );

    if (existing.length === 0) {
      const now = new Date();
      const hour = now.getHours();

      const champ = (hour < 12)? 'heure_arrive_matin' : 'heure_arrive_aprem';

      await db.query(
        `INSERT INTO pointage_journalier (date, ${champ}, matricule, id_horaire)
         VALUES (CURDATE(), NOW(), ?, ?)`,
        [id_agent, activeShedule[0].id_horaire]
      );
    } else {
      if(type === 'Morning'){
        const champ = existingAM[0].heure_arrive_matin? 'heure_sortie_matin' : 'heure_arrive_matin';
        await db.query(
          `UPDATE pointage_journalier SET ${champ} = NOW() WHERE matricule = ? AND DATE(date) = CURDATE()`,
          [id_agent]
        );
      }
      else{
        const champ = existingPM[0].heure_arrive_aprem? 'heure_sortie_aprem' : 'heure_arrive_aprem';
        await db.query(
          `UPDATE pointage_journalier SET ${champ} = NOW() WHERE matricule = ? AND DATE(date) = CURDATE()`,
          [id_agent]
        );
      }
      
    }

    return { success: true, message: `Pointage ${type} enregistré à ${heure}` };
  },

  async addLeaving(id_agent: string, type: string, description? : string, id_pointage? : string) {
    const [existing]: any = await db.query(
      `SELECT id_pointage FROM pointage_journalier WHERE matricule = ? AND DATE(date) = CURDATE()`,
      [id_agent]
    );

    if (existing.length != 0) {
      const idPoint = existing[0].id_pointage;
      if (type === 'Return'){
        await db.query(
          `UPDATE absence_temporaire SET heure_retour_temporaire = NOW() WHERE id_absence_temporaire = ?`,
          [id_pointage]
        );
      }
      else{
        await db.query(
          `INSERT INTO absence_temporaire (heure_sortie_temporaire, description, id_pointage) VALUES (NOW(), ?, ?)`,
          [description,idPoint]
        );
      }
      return { success: true, message: `Sortie ${type} enregistré`};
    }
    else{

    }
    
  },
};
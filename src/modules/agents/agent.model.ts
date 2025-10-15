import db from '../../config/db';

export interface Agent {
    matricule: string;
    nom: string;
    division: string;
    poste: string;
    status: 'Active' | 'Inactive' | 'On Leave';
}
  
export const AgentModel = {
  findAll: async (): Promise<Agent[]> => {
    // 1️⃣ Récupère tous les agents
    const [rows]: any = await db.query(`
      SELECT a.matricule, a.nom, a.division, a.poste
      FROM agent a
    `);
  
    const today = new Date().toISOString().split("T")[0]; // ex. "2025-10-11"
  
    // 2️⃣ Pour chaque agent, on détermine son statut
    const agentsWithStatus = await Promise.all(
      rows.map(async (agent: any) => {
        // --- Vérifie s’il est en absence longue aujourd’hui ---
        const [longAbsence]: any = await db.query(
          `SELECT * FROM absence_longue 
           WHERE matricule = ? 
             AND ? BETWEEN date_debut AND date_fin`,
          [agent.matricule, today]
        );
  
        if (longAbsence.length > 0) {
          return {
            ...agent,
            status: "Inactive" as const, // absence longue
          };
        }
  
        // --- Vérifie s’il a un pointage aujourd’hui ---
        const [attendance]: any = await db.query(
          `SELECT * FROM pointage_journalier 
           WHERE matricule = ? AND date = ?`,
          [agent.matricule, today]
        );
  
        if (attendance.length === 0) {
          return {
            ...agent,
            status: "Inactive" as const, // pas de pointage
          };
        }
  
        const pointage = attendance[0];
  
        // --- Vérifie s’il a une absence temporaire liée à ce pointage ---
        const [tempAbs]: any = await db.query(
          `SELECT * FROM absence_temporaire WHERE id_pointage = ?`,
          [pointage.id_pointage]
        );
  
        if (tempAbs.length > 0) {
          return {
            ...agent,
            status: "On Leave" as const, // sortie temporaire
          };
        }
  
        // --- Sinon, il est présent ---
        return {
          ...agent,
          status: "Active" as const,
        };
      })
    );
  
    return agentsWithStatus;
  },
  

  findById: async (matricule: string): Promise<any | null> => {
    console.log('🟢 [Model] Requête pour matricule:', matricule);
  
    // --- 1️⃣ Récupérer l'agent de base
    const [agentRows]: any = await db.query(
      'SELECT * FROM agent WHERE matricule = ?',
      [matricule]
    );
  
    console.log('🟢 [Model] Résultat agentRows:', agentRows);
  
    if (!agentRows.length) {
      console.log('🔴 Aucun agent trouvé dans la base');
      return null;
    }
  
    const agent = agentRows[0];
  
    // --- 2️⃣ Vérifier s'il a un pointage aujourd'hui
    const [pointageRows]: any = await db.query(
      `SELECT * FROM pointage_journalier 
       WHERE matricule = ? 
       AND DATE(date) = CURDATE()`,
      [matricule]
    );
  
    // --- 3️⃣ Vérifier s'il a une absence temporaire (aujourd'hui)
    const [absenceTempRows]: any = await db.query(
      `SELECT at.*
       FROM absence_temporaire at
       JOIN pointage_journalier pj ON at.id_pointage = pj.id_pointage
       WHERE pj.matricule = ? 
       AND DATE(pj.date) = CURDATE()`,
      [matricule]
    );
  
    // --- 4️⃣ Vérifier s'il a une absence longue en cours
    const [absenceLongueRows]: any = await db.query(
      `SELECT * FROM absence_longue
       WHERE matricule = ?
       AND CURDATE() BETWEEN date_debut AND date_fin`,
      [matricule]
    );
  
    // --- 5️⃣ Déterminer le statut
    let status = 'Inactive';
    if (pointageRows.length > 0) {
      status = 'Active';
    }
    if (absenceLongueRows.length > 0 || absenceTempRows.length > 0) {
      status = 'On Leave';
    }
  
    console.log(`🟢 Statut déterminé pour ${matricule}: ${status}`);
  
    // --- 6️⃣ Retour final
    return {
      matricule: agent.matricule,
      nom: agent.nom,
      division: agent.division,
      poste: agent.poste,
      status,
    };
  },
  
    
  
  create: async (data: Agent): Promise<Agent> => {
    const { matricule, nom, division, poste } = data;
  
    // --- 1️⃣ Insertion dans la table agent
    await db.query(
      'INSERT INTO agent (matricule, nom, division, poste) VALUES (?, ?, ?, ?)',
      [matricule, nom, division, poste]
    );
  
    // --- 2️⃣ Vérifier les informations pour déterminer le status
    // Vérifier s’il a pointé aujourd’hui
    const [pointageRows]: any = await db.query(
      `SELECT * FROM pointage_journalier 
       WHERE matricule = ? 
       AND DATE(date) = CURDATE()`,
      [matricule]
    );
  
    // Vérifier les absences temporaires liées à un pointage aujourd’hui
    const [absenceTempRows]: any = await db.query(
      `SELECT at.*
       FROM absence_temporaire at
       JOIN pointage_journalier pj ON at.id_pointage = pj.id_pointage
       WHERE pj.matricule = ? 
       AND DATE(pj.date) = CURDATE()`,
      [matricule]
    );
  
    // Vérifier les absences longues
    const [absenceLongueRows]: any = await db.query(
      `SELECT * FROM absence_longue
       WHERE matricule = ?
       AND CURDATE() BETWEEN date_debut AND date_fin`,
      [matricule]
    );
  
    // --- 3️⃣ Déterminer le statut
    let status: 'Active' | 'Inactive' | 'On Leave' = 'Inactive';
    if (pointageRows.length > 0) status = 'Active';
    if (absenceTempRows.length > 0 || absenceLongueRows.length > 0) status = 'On Leave';
  
    console.log(`🟢 [Model] Agent ${matricule} créé avec statut: ${status}`);
  
    // --- 4️⃣ Retourner l’agent nouvellement créé avec son statut
    return {
      matricule,
      nom,
      division,
      poste,
      status,
    };
  },
  

  update: async (matricule: string, updates: Partial<Agent>): Promise<Agent | null> => {
    // Champs réellement existants dans la table agent
    const validFields = ['nom', 'division', 'poste'];
  
    // On ne garde que les champs valides
    const filteredUpdates = Object.entries(updates)
      .filter(([key]) => validFields.includes(key))
      .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {});
  
    if (Object.keys(filteredUpdates).length === 0) {
      // Aucun champ valide à mettre à jour
      return AgentModel.findById(matricule);
    }
  
    const fields = Object.keys(filteredUpdates)
      .map((key) => `${key} = ?`)
      .join(', ');
  
    const values = Object.values(filteredUpdates);
  
    await db.query(
      `UPDATE agent SET ${fields} WHERE matricule = ?`,
      [...values, matricule]
    );
  
    return AgentModel.findById(matricule);
  },
  

  delete: async (matricule: string): Promise<boolean> => {
    const [result]: any = await db.query('DELETE FROM agent WHERE matricule = ?', [matricule]);
    return result.affectedRows > 0;
  },
};
